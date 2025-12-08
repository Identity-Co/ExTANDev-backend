import { Request, Response, NextFunction } from "express";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import passport from "passport";

import { ITours, ITourCategories, ITourActivities, ITourDetails, Departure, SiteLinks, Geography, Introduction, MealsIncluded, DaysComponents, DaysSummary, GalleryImages, Promotions, Availabilities } from "../interfaces/tours";
import mongoose, { Types } from "mongoose";

const Tours = mongoose.model("Tours");
const TourDetails = mongoose.model("TourDetails");
const TourCategories = mongoose.model("TourCategories");
const TourActivities = mongoose.model("TourActivities");

// TOUR CRON UPDATES
import pLimit from 'p-limit';

const TOUR_CONCURRENCY = 10; // Number of tours to fetch in parallel
const DEP_CONCURRENCY = 5;   // Number of departures to fetch in parallel

const axios = require('axios');

const IMG_TYPES = ['BANNER_HIRES', 'LARGE_SQUARE', 'BANNER', 'BANNER_DESKTOP', 'MAP'];
const API_KEY = 'test_7787abca29a7db0744a044532eb8a9542a5aa896';
const BASE_URL = 'https://rest.gadventures.com';
const headers = { 'X-Application-Key': API_KEY };

const accommodationMap: Record<number, string> = {};
const activitiesMap: Record<number, string> = {};
// activitiesMap[activity.api_activity_id] = activity.activity_name;

export const deleteOldCategories = async (keepIds: number[]) => {
  try {
    const result = await TourCategories.deleteMany({
      api_resource: "gadventures",
      api_category_id: { $nin: keepIds },
    });

    console.log(result);
    console.log(`${result.deletedCount} tour-categories deleted successfully.`);
  } catch (error) {
    console.error("Error deleting old tour-categories:", error);
  }
};

export const deleteOldTours = async (keepIds: number[]) => {
  try {
    /*
    // WORKING BY UPDATED_AT DATE
    // Get today's start & end times
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const result = await Tours.deleteMany({
      api_resource: "gadventures",
      updated_at: { $not: { $gte: startOfToday, $lte: endOfToday } }
    }); */

    const result = await Tours.deleteMany({
      api_resource: "gadventures",
      api_tour_id: { $nin: keepIds },
    });

    console.log(result);
    console.log(`${result.deletedCount} tours deleted successfully.`);
  } catch (error) {
    console.error("Error deleting old tours:", error);
  }
};

// Fetch all pages recursively
async function fetchAllTours() {
  let curPage = 1;
  let hasNext = true;
  const fetchedIds: number[] = [];
  const fetchedCatIds: number[] = [];

  while (hasNext) {
    console.log(`Fetching Category page ${curPage}...`);
    
    //const url = `${BASE_URL}/tour_categories?category_type.id=16&max_per_page=50&page=${curPage}`;
    const url = `${BASE_URL}/tour_categories?max_per_page=100&page=${curPage}`;

    const res = await axios.get(url, { headers });
    const data = res.data;

    if (data?.results?.length) {
      const limit = pLimit(TOUR_CONCURRENCY);
      await Promise.all(
        data.results.map((row: any) => 
          limit(async () => {
            await processTourCategory(row);
            fetchedCatIds.push(row.id);
          })
        )
      );
    }

    // check next page
    hasNext = data?.links?.some((link: any) => link.rel === 'next');
    curPage++;
  }

  curPage = 1; hasNext = true;
  while (hasNext) {
    console.log(`Fetching tour_dossiers page ${curPage}...`);
    const url = `${BASE_URL}/tour_dossiers?advertised_departures.currency=USD&max_per_page=10&page=${curPage}`;

    const res = await axios.get(url, { headers });
    const data = res.data;

    if (data?.results?.length) {
      const limit = pLimit(TOUR_CONCURRENCY);
      await Promise.all(
        data.results.map((row: any) => 
          limit(async () => {
            await processTour(row);
            fetchedIds.push(row.id);
          })
        )
      );
    }

    // check next page
    hasNext = data?.links?.some((link: any) => link.rel === 'next');
    curPage++;
  }

  console.log('Deleting Category excludes : ', fetchedCatIds)
  deleteOldCategories(fetchedCatIds);

  console.log('Deleting Tours excludes : ', fetchedIds)
  deleteOldTours(fetchedIds);

  console.log('All tours fetched ✅');
}

// Save/Update single category
async function processTourCategory(row: any) {
  try {
    const category: {
      api_category_id: number;
      category_name: string;
      description?: string;
      api_parent_id?: number;
      api_resource: string;
    } = {
      api_category_id: row.id,
      category_name: row.name,
      description: row.description ?? '',
      api_parent_id: row?.category_type?.id || 0,
      api_resource: 'gadventures',
    };

    await TourCategories.findOneAndUpdate({ api_category_id: category.api_category_id }, category, { upsert: true });
    console.log(`Category saved: ${category.api_category_id}`);
  } catch (err) {
    //console.error(`❌ Error processTourCategory:`, err.message);
  }
}

// Save/Update single Activity
async function processTourActivity(row: any) {
  const summaryDetail = row.details.find((d: any) => d.detail_type?.code === "COMMON__SUMMARY")

  try {
    const activity: {
      api_activity_id: number;
      activity_name: string;
      description?: string;
    } = {
      api_activity_id: row.id,
      activity_name: row.name,
      description: summaryDetail?.body ?? '',
    };

    await TourActivities.findOneAndUpdate({ api_activity_id: activity.api_activity_id }, activity, { upsert: true });
    console.log(`Activity saved: ${activity.api_activity_id}`);
  } catch (err) {
    //console.error(`❌ Error processTourActivity:`, err.message);
  }
}

// Fetch single tour + departures
async function processTour(row: any) {
  try {
    const resSingle = await axios.get(row.href, { headers });
    const dataSingle = resSingle.data;
    const cat_ids: number[] = [];
    const intro_array: Introduction[] = [];
    const allActivities: number[] = [];

    const todayDate = new Date().toISOString().split("T")[0];

    const tour: {
      api_resource: string;
      api_tour_id: number;
      api_category_ids: number[];
      name: string;
      slug: string;
      site_url: string;
      product_line: string;
      image: string;
      description: string;
      locations: string[];
      regions: string;
      start_price: number;
      tour_days: number;
      departures: Departure[];
    } = {
      api_resource: 'gadventures',
      api_tour_id: row.id,
      api_category_ids: [],
      name: row.name,
      slug: row.slug,
      site_url: '',
      product_line: row.product_line,
      image: '',
      description: dataSingle.description || '',
      locations: [],
      regions: '',
      start_price: 0,
      tour_days: 0,
      departures: []
    };

    const tour_details: {
      ref_tour_id: string,
      ref_api_resource: string,
      ref_api_tour_id: number,
      site_links: SiteLinks,
      map_image: string,
      geography: Geography,
      categories: string[],
      full_details: Introduction[],
      meals_included: MealsIncluded,
      days_summary: DaysSummary[],
      gallery_images: GalleryImages[],
      promotions: Promotions[],
      availabilities: Availabilities[]
    } = {
      ref_tour_id: '',
      ref_api_resource: 'gadventures',
      ref_api_tour_id: row.id || 0,
      site_links: {},
      map_image: '',
      geography: {},
      categories: [],
      full_details: [],
      meals_included: {},
      days_summary: [],
      gallery_images: [],
      promotions: [],
      availabilities: []
    };

    // Image selection
    if (dataSingle.images?.length) {
      const images: { [key: string]: string } = {};
      for (const img of dataSingle.images) {
        images[img.type] = img.image_href ?? '';
        if(img.type == 'MAP') { tour_details.map_image = img.image_href ?? ''; }
      }
      for (const t of IMG_TYPES) {
        if (images[t]) {
          tour.image = images[t];
          break;
        }
      }
    }

    if (dataSingle.site_links?.length) {
      for (const s_link of dataSingle.site_links) {
        if(s_link.type == 'OVERVIEW' && s_link.href != '') {
          tour.site_url = s_link.href ?? '';
        }

        if(s_link.type == 'PRICING' && s_link.href != '') {
          tour_details.site_links.checkout = s_link.href ?? '';
        }
        if(s_link.type == 'DETAILS_PDF' && s_link.href != '') {
          tour_details.site_links.download_pdf = s_link.href ?? '';
        }
          
      }
    }

    if (dataSingle.categories?.length) {
      for (const s_cat of dataSingle.categories) {
        if(s_cat.category_type.id == 16) {
          cat_ids.push(s_cat.id);
        }

        tour_details.categories.push(s_cat.id);
      }
    }
    tour.api_category_ids = cat_ids;

    if (dataSingle.details?.length) {
      for (const s_cat of dataSingle.details) {
        const intro_id = s_cat.detail_type.id;
        const intro_label = s_cat.detail_type.label;
        const intro_content = s_cat.body;
        intro_array.push({'intro_id': intro_id, 'label': intro_label, 'content': intro_content});
      }
    }
    tour_details.full_details = intro_array;

    // Geography
    if (dataSingle.geography?.visited_countries?.length) {
      tour.locations = dataSingle.geography.visited_countries.map((c: { name: string }) => c.name);
      tour.regions = dataSingle.geography?.region?.name ?? '';

      tour_details.geography.start_city = dataSingle.geography?.start_city?.name ?? '';
      tour_details.geography.finish_city = dataSingle.geography?.finish_city?.name ?? '';
    }

    if(dataSingle.departures?.href) {
      const roomUrl = `${dataSingle.departures.href}?start_date__gt=${todayDate}&max_per_page=100&page=1`;

      const resRooms = await axios.get(roomUrl, { headers });
      const roomData = resRooms.data;
      if(roomData?.results) {
        const filteredRooms = roomData.results
          .filter((dep: any) => dep.availability.status !== "NOT_BOOKABLE")
          .map((dep: any) => {
            const usdPriceObj = dep.lowest_pp2a_prices.find((p: any) => p.currency === "USD");

            return {
              depart_id: dep.id,
              start_date: dep.start_date,
              finish_date: dep.finish_date,
              status: dep.availability.status,
              spaces: dep.availability.total,
              price: usdPriceObj ? usdPriceObj.amount : 0,
            };
          });
        tour_details.availabilities = filteredRooms;
      }
    }

    // Advertised departures
    if (dataSingle.advertised_departures?.length) {
      const uniqueDepartures = dataSingle.advertised_departures.filter(
        (advt: any, index: number, self: any[]) =>
          index === self.findIndex((t: any) => t.departure?.id === advt.departure?.id)
      );

      const depLimit = pLimit(DEP_CONCURRENCY);

      let tour_min_price = 0; let activities = [];

      await Promise.all(
          uniqueDepartures.map((advt: any) =>
            depLimit(async () => {
              if (!advt.departure) return;
              const depId = advt.departure.id;
              const depHref = advt.departure.href;
              const promoList = advt.promotion;

              const resDep = await axios.get(depHref, { headers });
              const depData = resDep.data;

              const dep: Departure = {
                api_departure_id: depId,
                start_date: depData.start_date,
                finish_date: depData.finish_date,
                date_cancelled: depData.date_cancelled,
                availability_status: depData.availability?.status || '',
                availability_total: depData.availability?.total || 0,
                lowest_price: 0,
                activities: [],
              };

              if (depData.lowest_pp2a_prices?.length) {
                for (const price of depData.lowest_pp2a_prices) {
                  if (price.currency === 'USD') {
                    dep.lowest_price = price.amount;
                    if(tour_min_price == 0 || tour_min_price > price.amount) {
                      tour_min_price = price.amount;
                    }
                  }
                }
              }

              if (depData.addons?.length) {
                for (const addon of depData.addons) {
                  if (addon?.product?.type === 'activities' && addon?.product?.name !== '') {
                    activities.push(addon.product.name);
                  }
                }
                dep.activities = activities;
              }

              tour.departures.push(dep);

              const all_promos: Promotions[] = [];
              if (promoList?.length) {
                for (const promo_row of promoList) {
                  if (promo_row?.id !== 0 && promo_row?.href !== '') {
                    const resPromo = await axios.get(promo_row.href, { headers });
                    const promoData = resPromo.data;

                    all_promos.push({
                      promo_id: promoData.id,
                      promo_name: promoData.name,
                      promotion_code: promoData.promotion_code,
                      discount_amount: promoData.discount_amount ?? 0,
                      discount_percent: promoData.discount_percent ?? 0,
                      start_datetime: promoData.sale_start_datetime,
                      finish_datetime: promoData.sale_finish_datetime,
                      terms_and_conditions: promoData.terms_and_conditions
                    });
                  }
                }
              }
              tour_details.promotions = all_promos;

              if (depData.structured_itineraries?.length) {
                for (const itiner of depData.structured_itineraries) {
                  console.log('itiner URL: ', itiner.href)

                  const resItiner = await axios.get(itiner.href, { headers });
                  const itinerData = resItiner.data;
                  //console.log(itinerData);

                  tour_details.meals_included = itinerData.meals_included ?? {};

                  let all_days = [];
                  if (itinerData.days?.length) {
                    for (const currDay of itinerData.days) {
                      const days_data: DaysSummary = {
                        day: currDay.day,
                        label: currDay.label,
                        summary: (currDay.summary ?? '') + ' ' + (currDay.description ?? ''),
                        instructions: currDay.instructions ?? '',
                        start_location: currDay.start_location?.name ?? '',
                        end_location: currDay.end_location?.name ?? '',
                        meals: currDay.meals?.map((meal: any) => meal.type) ?? [],
                        components: [],
                        optional_activities: []
                      };

                      let components: DaysComponents[] = [];
                      if (currDay.components?.length) {
                        for (const currCompnt of currDay.components) {
                          if(currCompnt.type != 'TRANSPORT') {
                            const compSmall = currCompnt.type.toLowerCase(); const comp_key = `${compSmall}_dossier`;
                            const c_dossier = currCompnt[comp_key];

                            const days_compnt: DaysComponents = {
                              type: currCompnt.type,
                              name: c_dossier?.name ?? '',
                              summary: currCompnt.summary ?? ''
                            };

                            components.push(days_compnt);
                          }
                        }
                      }
                      days_data.components = components;

                      const optionalActivities: number[] = [];
                      if (currDay.optional_activities?.length) {
                        /*optionalActivities = currDay.optional_activities
                          .map((act: any) => act.activity_dossier?.id)
                          .filter((id: number | undefined) => id !== undefined);*/

                        for (const optActivity of currDay.optional_activities) {
                          const act_dossier = optActivity.activity_dossier;

                          if(act_dossier?.href != '' && act_dossier?.id > 0) {
                            optionalActivities.push(act_dossier.id);

                            if(!allActivities.includes(act_dossier.id)) {
                              allActivities.push(act_dossier.id)
                              const resActivity = await axios.get(act_dossier.href, { headers });
                              const activityData = resActivity?.data;
                              if(activityData) {
                                await processTourActivity(activityData);
                              }
                            }
                          }
                        }
                      }

                      days_data.optional_activities = optionalActivities;

                      all_days.push(days_data);
                    }
                  }
                  tour_details.days_summary = all_days;

                  console.log('itinerData.media: ');
                  console.log(itinerData.media);

                  const tour_images: GalleryImages[] = [];
                  if (itinerData.media?.href) {
                    const media_url = itinerData.media.href;
                    console.log('Media URL: ', media_url);

                    const resMedia = await axios.get(media_url, { headers });
                    const mediaData = resMedia.data;

                    if (mediaData?.results?.length) {
                      for (const currMedia of mediaData.results) {
                        if (currMedia.type === 'IMAGE' && currMedia.image?.url) {
                          tour_images.push({
                            type: 'IMAGE',
                            url: currMedia.image.url,
                            video_url: '',
                          });
                        } else if (currMedia.type === 'VIDEO' && currMedia.videos?.[0]?.url && currMedia.video_thumb) {
                          tour_images.push({
                            type: 'VIDEO',
                            url: currMedia.video_thumb??'',
                            video_url: currMedia.videos[0].url,
                          });
                        }
                      }
                    }
                  }
                  tour_details.gallery_images = tour_images;

                  /*if (addon?.product?.type === 'activities' && addon?.product?.name !== '') {
                    activities.push(addon.product.name);
                  }*/
                }
                //dep.activities = activities;
              }

            })
          )
      );

      if(tour.departures.length > 0) {
        // Get days from first departure
        const firstDep = tour.departures[0];
        const start = new Date(firstDep.start_date);
        const end = new Date(firstDep.finish_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        // You can attach these values to the tour object if you want
        tour.start_price = tour_min_price;
        tour.tour_days = days + 1;

        // Insert/Update MongoDB
        const updatedTour = await Tours.findOneAndUpdate({ api_tour_id: tour.api_tour_id }, tour, { upsert: true, new: true });
        
        //console.log(`Tour saved: ${tour.api_tour_id}`);
        if (updatedTour) {
          const t_id = updatedTour._id.toString();
          console.log("Updated/Inserted ID: ", t_id);
          tour_details.ref_tour_id = t_id;

          const updatedTourDetails = await TourDetails.findOneAndUpdate({ ref_tour_id: t_id }, tour_details, { upsert: true, new: true });

          //console.log(`Tour Details:`);
          //console.log(tour_details);
        }
      }
    }

  } catch (err) {
    //console.error(`❌ Error processTour:`, err.message);
  }
}


export async function importTours() {
  try {
    console.log('fetchAllTours called...')
    await fetchAllTours();
    //res.status(200).json({ message: 'Tours imported successfully' });
  } catch (error) {
    //next(error);
  }
}
