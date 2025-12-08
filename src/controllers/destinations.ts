import { IFieldNotes } from "../interfaces/field_notes";
import { IUser } from "./../interfaces/user";
import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";
import { UploadRequest } from '../types/UploadRequest';

import fs from 'fs';
import path from 'path';

const Destination = mongoose.model("Destination");
const Resorts = mongoose.model("Resorts");

// Output File path
const dirPath = path.join('public','uploads','destinations');

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
  console.log('Directory created');
}

try {
  fs.chmodSync(dirPath, 777);
} catch (err) {
  console.error('Failed to change permissions:', err);
}

export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let destinations:any = [];
    destinations = await Destination.find();
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: destinations });
  } catch (error) {
    next(error);
  }
}

export async function filterDestinations(
  req: Request,
  res: Response,
  next: NextFunction
) {
    try {
        const location = req.body.location
        const resort = req.body.resort

        // Start with basic filter
        const query: any = {};

        if (location) {
          query.destination_location = location;
        }

        if (resort) {
          query["resorts.resorts"] = {
            $elemMatch: { title: resort } 
          };
        }

        let destinations = await Destination.find(query);

        return res
            .status(config.statusCode.SUCCESS)
            .json({ success: true, data: destinations });
    }
    catch (error) {
        next(error);
    }
}

export async function filterDestinationsAdventures(
  req: Request,
  res: Response,
  next: NextFunction
) {
    try {
        const _id = new Types.ObjectId(req.params.id);
        const suitable_for = req.body.suitable_for
        const season = req.body.season

        // Start with basic filter
        const query: any = {};

        query._id = _id;

        // Build an array of conditions inside adventure_lists
        const adventureConditions: any = {};

        if (suitable_for) {
          adventureConditions.suitable_for = { $in: [suitable_for] };
        }

        if (season) {
          adventureConditions.seasons_time = { $in: [season] };
        }

        let projection: any = {};
        if (Object.keys(adventureConditions).length > 0) {
          query["adventures.adventure_lists"] = { $elemMatch: adventureConditions };
          projection["adventures.adventure_lists"] = 1;
        }

        let destinations = await Destination.find(query, projection);

        console.log(destinations);

        return res
            .status(config.statusCode.SUCCESS)
            .json({ success: true, data: destinations });
    }
    catch (error) {
        next(error);
    }
}

export async function homePage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    const ids = body.ids;

    var destinations = [];

    if(ids.length) {
      destinations = await Destination.find({
        _id: { $in: ids }
      });
    }

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: destinations });
  } catch (error) {
    next(error);
  }
}

export async function getDestination(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    const data = await Destination.findOne({
      _id: _id,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Destination not found",
        "getDestination"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function createDestination(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    /*const _check = await Destination.findOne({
      title: body.title,
    });
    if (_check) {
      throw new HttpException(
        config.statusCode.CONFLICT,
        "Destination already exist",
        "createDestination"
      );
    }*/

    const allFiles = req.files as Express.Multer.File[];

    const destination_image = allFiles.find(f => f.fieldname === "destination_image");

    // Process overview banners images
    const overview_banners = allFiles
      .filter(f => f.fieldname.startsWith("overview_banners"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/overview_banners\[(\d+)\]\[image\]/);
        if (match) {
          const index = match[1];
          acc[index] = `uploads\\\\destinations\\\\${f.filename}`;
        }
        return acc;
      }, {});

     // Process about sections images
    const about_sections = allFiles
      .filter(f => f.fieldname.startsWith("about_sections"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/about_sections\[(\d+)\]\[image\]/);
        if (match) {
          const index = match[1];
          acc[index] = `uploads\\destinations\\${f.filename}`;
        }
        return acc;
      }, {});

    // Process slider images
    const slider_images = allFiles
      .filter(f => f.fieldname.startsWith("overview_slider_images"))
      .map(f => `uploads\\destinations\\${f.filename}`);

    if (destination_image) {
      req.body['image'] = `uploads\\destinations\\${destination_image.filename}`;
    }

    const quickFactsBackground = allFiles.find(f => f.fieldname === "quick_facts_background_file");
    if (quickFactsBackground) {
      req.body.overview['quick_facts_background'] = `uploads\\destinations\\${quickFactsBackground.filename}`;
    }

    if (req.body.overview_banners) {
      body.overview_banners.forEach((file: any, index: number) => {
        if (overview_banners[index]) {
          body.overview_banners[index].image = overview_banners[index];
        }
      });
    }

    // Ensure about sections have the right file path
    if (body.about_sections) {
      body.about_sections.forEach((file: any, index: number) => {
        if (about_sections[index]) {
          body.about_sections[index].image = about_sections[index];
        }
      });
    }

    if (req.body.overview) {
      req.body.overview['slider_images_tmp'] = slider_images.length > 0 ? slider_images : [];

      if(req.body.overview_slider_images_old){
        req.body.overview['slider_images'] = req.body.overview_slider_images_old.concat(req.body.overview['slider_images_tmp']);
      }
    }

    let destData: any = {};
    destData = {
        'title': req.body.title,
        'sub_title': req.body.sub_title,
        'destination_location': req.body.destination_location,
        'image': req.body.image,
        'overview': {
          'banners': req.body.overview_banners || [],
          'about_title': req.body.overview.about_title,
          'about_content': req.body.overview.about_content,
          'button_text': req.body.overview.button_text,
          'button_link': req.body.overview.button_link,
          'slider_images': req.body.overview.slider_images || [],
          'sections': req.body.about_sections || [],
          'quick_facts_background': req.body.overview.quick_facts_background,
          'quick_facts_title': req.body.overview.quick_facts_title,
          'facts': req.body.facts,
          'faq': req.body.faq,
          'adventure_posts': req.body.overview?.adventure_posts || [],
          'feature_resorts': {
            'title': req.body.overview.feature_resorts_title,
            'resorts': req.body.overview.feature_resorts || []
          }
        },
        'meta_description': req.body.meta_description,
        'meta_keywords': req.body.meta_keywords,
        'meta_title': req.body.meta_title,
        'page_url': req.body.page_url,
        'author': req.body.author,
        'publisher': req.body.publisher,
        'copyright': req.body.copyright,
        'rating': req.body.rating,
        'revisit_after': req.body.revisit_after,
        'robots': req.body.robots,
        'classification': req.body.classification,
        'share_button_link': req.body.share_button_link,
        'share_button_text': req.body.share_button_text,
        'share_sub_title': req.body.share_sub_title,
        'share_title': req.body.share_title,
        'subscribe_button_link': req.body.subscribe_button_link,
        'subscribe_button_text': req.body.subscribe_button_text,
        'subscribe_sub_title': req.body.subscribe_sub_title,
        'subscribe_title': req.body.subscribe_title,
      };
    // return;

    let uniqueSlug = req.body.page_url
    let counter = 1;
    while (
      await Destination.findOne({
        page_url: uniqueSlug,
      })
    ) {
      uniqueSlug = `${req.body.page_url}-${counter}`;
      counter++;
    }

    destData.page_url = uniqueSlug;

    const destination = await Destination.create({
      ...destData,
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: destination });
  } catch (error) {
    next(error);
  }
}

export async function updateDestination(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);
    let body = req.body;

    // Check for raw data in 'data' and parse it if necessary
    if (req.body.data !== undefined) {
      body = JSON.parse(req.body.data);
    }

    const file = req.file;
    const destination = await Destination.findOne({ _id });

    // If destination not found, throw an error
    if (!destination)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Destination not exist",
        "updateDestination"
      );

    const allFiles = req.files as Express.Multer.File[];

    // Process destination image
    const destination_image = allFiles.find(f => f.fieldname === "destination_image");

    const banner_image = allFiles.find(f => f.fieldname === "banner_image_file");

    if (banner_image && banner_image.filename) {
      if (req.body.resorts) {
        req.body.resorts.banner_image = `uploads\\\\destinations\\\\${banner_image.filename}`;
      } else if (req.body.adventures) {
        req.body.adventures.banner_image = `uploads\\\\destinations\\\\${banner_image.filename}`;
      } else if (req.body.stories) {
        req.body.stories.banner_image = `uploads\\\\destinations\\\\${banner_image.filename}`;
      }
    }

    const quickFactsBackground = allFiles.find(f => f.fieldname === "quick_facts_background_file");
    if (quickFactsBackground) {
      req.body.overview['quick_facts_background'] = `uploads\\\\destinations\\\\${quickFactsBackground.filename}`;
    }

    // Process overview banners images
    const overview_banners = allFiles
      .filter(f => f.fieldname.startsWith("overview_banners"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/overview_banners\[(\d+)\]\[image\]/);
        if (match) {
          const index = match[1];
          acc[index] = `uploads\\\\destinations\\\\${f.filename}`;
        }
        return acc;
      }, {});

    // Process about sections images
    const about_sections = allFiles
      .filter(f => f.fieldname.startsWith("about_sections"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/about_sections\[(\d+)\]\[image\]/);
        if (match) {
          const index = match[1];
          acc[index] = `uploads\\destinations\\${f.filename}`;
        }
        return acc;
      }, {});

    // Process slider images
    const slider_images = allFiles
      .filter(f => f.fieldname.startsWith("overview_slider_images"))
      .map(f => `uploads\\destinations\\${f.filename}`);

    // Process resorts sections images
    const resorts_sections = allFiles
      .filter(f => f.fieldname.startsWith("resorts_sections"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/resorts_sections\[(\d+)\]\[image\]/);
        if (match) {
          const index = match[1];
          acc[index] = `uploads\\destinations\\${f.filename}`;
        }
        return acc;
      }, {});

    // Process stories sections images
    const story_sections = allFiles
      .filter(f => f.fieldname.startsWith("story_sections"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/story_sections\[(\d+)\]\[userprofile\]/);
        if (match) {
          const index = match[1];
          acc[index] = `uploads\\destinations\\${f.filename}`;
        }
        return acc;
      }, {});

    const story_galleries = allFiles
      .filter(f => f.fieldname.startsWith("story_sections"))
      .reduce((acc: any, f) => {
        const match_g = f.fieldname.match(/story_sections\[(\d+)\]\[gallery\]\[(\d+)\]/);

        if (match_g) {
          const sectionIndex = match_g[1];
          const innerIndex = match_g[2];
          if (!acc[sectionIndex]) {
            acc[sectionIndex] = [];
          }
          acc[sectionIndex][innerIndex] = `uploads\\destinations\\${f.filename}`;
        }
        return acc;
      }, {});


      // Process adventure list sections images
      const adventure_lists_images = allFiles
      .filter(f => f.fieldname.startsWith("adventures_adventure_lists_imgs"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/adventures_adventure_lists_imgs\[(\d+)\]\[feature_image_file\]/);
        if (match) {
          const adventureIndex = match[1];
          acc[adventureIndex] = `uploads\\destinations\\${f.filename}`;
        }
        return acc;
      }, {});

      const adventure_lists_image_banner = allFiles
      .filter(f => f.fieldname.startsWith("adventures_adventure_lists_imgs"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/adventures_adventure_lists_imgs\[(\d+)\]\[banner_image_file\]/);
        if (match) {
          const adventureIndex = match[1];
          acc[adventureIndex] = `uploads\\destinations\\${f.filename}`;
        }
        return acc;
      }, {});

      const adventure_lists_image_map = allFiles
      .filter(f => f.fieldname.startsWith("adventures_adventure_lists_imgs"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/adventures_adventure_lists_imgs\[(\d+)\]\[map_image_file\]/);
        if (match) {
          const adventureIndex = match[1];
          acc[adventureIndex] = `uploads\\destinations\\${f.filename}`;
        }
        return acc;
      }, {});

      const adventure_lists_content_images = allFiles
      .filter(f => f.fieldname.startsWith("adventures_adventure_lists_imgs"))
      .reduce((acc: any, f) => {
        const match = f.fieldname.match(/adventures_adventure_lists_imgs\[(\d+)\]\[content_list\]\[(\d+)\]\[image_file\]/);

        if (match) {
          const adventureIndex = match[1];
          const contentIndex = match[2];

          //logToFile('===LOOPED'+match[1]);

          // Initialize the nested structure if it doesn't exist
          if (!acc[adventureIndex]) {
            acc[adventureIndex] = [];
          }
          if (!acc[adventureIndex][contentIndex]) {
            acc[adventureIndex][contentIndex] = [];
          }

          // Assign the file path to the correct position in the nested structure
          acc[adventureIndex][contentIndex] = `uploads\\destinations\\${f.filename}`;
        }

        return acc;
      }, {});

    // Assign the destination image if it exists
    if (destination_image) {
      req.body['image'] = `uploads\\destinations\\${destination_image?.filename}`;
    }

    if (req.body.overview_banners) {
      body.overview_banners.forEach((file: any, index: number) => {
        if (overview_banners[index]) {
          body.overview_banners[index].image = overview_banners[index];
        }
      });
    }

    // Ensure about sections have the right file path
    if (body.about_sections) {
      body.about_sections.forEach((file: any, index: number) => {
        if (about_sections[index]) {
          body.about_sections[index].image = about_sections[index];
        }
      });
    }

    let resorts: any[] = [];
    if (req.body.resorts) {
      resorts = req.body.resorts_sections || [];
      if (Object.keys(resorts_sections).length > 0) {
        resorts.forEach((item: any, index: number) => {
          if (resorts_sections[index] !== undefined) {
            resorts[index].image = resorts_sections[index];
          }
          if (resorts[index].idtxt) {
            resorts[index]._id = new Types.ObjectId(resorts[index].idtxt);
          }
        });
      }else {
        resorts.forEach((item: any, index: number) => {
          if (resorts[index].idtxt) {
            resorts[index]._id = new Types.ObjectId(resorts[index].idtxt);
          }
        });
      }
    }

    let stroiesList: any[] = [];
    if (req.body.stories) {
      stroiesList = req.body.story_sections || [];
      if (Object.keys(story_sections).length > 0) {
        stroiesList.forEach((item: any, index: number) => {
          if (story_sections[index] !== undefined) {
            stroiesList[index].userprofile = story_sections[index];
          }
        });
      }
      if (Object.keys(story_galleries).length > 0) {
        stroiesList.forEach((item: any, index: number) => {
          if (story_galleries[index] !== undefined) {
            story_galleries[index].forEach((gal_item: any, gal: number) => {
              if (!stroiesList[index].gallery) {
                stroiesList[index].gallery = [];
              }
              stroiesList[index].gallery[gal] = gal_item;
            });
          }
        });
      }
    }

    let adventureLists: any[] = [];
    if (req.body.adventures_adventure_lists) {
      adventureLists = req.body.adventures_adventure_lists || [];
      if (Object.keys(adventure_lists_images).length > 0) {
        adventureLists.forEach((item: any, index: number) => {
          if (adventure_lists_images[index] !== undefined) {
            adventureLists[index].feature_image = adventure_lists_images[index];
          }
        });
      }

      if (Object.keys(adventure_lists_image_banner).length > 0) {
        adventureLists.forEach((item: any, index: number) => {
          if (adventure_lists_image_banner[index] !== undefined) {
            adventureLists[index].banner_image = adventure_lists_image_banner[index];
          }
        });
      }

      if (Object.keys(adventure_lists_image_map).length > 0) {
        adventureLists.forEach((item: any, index: number) => {
          if (adventure_lists_image_map[index] !== undefined) {
            adventureLists[index].map_image = adventure_lists_image_map[index];
          }
        });
      }
      if (Object.keys(adventure_lists_content_images).length > 0) {
        adventureLists.forEach((item: any, index: number) => {
          if (adventure_lists_content_images[index] !== undefined) {
            adventure_lists_content_images[index].forEach((gal_item: any, gal: number) => {
              if (!adventureLists[index].content_list) {
                //adventureLists[index].content_list[gal][image] = '';
                adventureLists[index].content_list = [];
              }

              if (!adventureLists[index].content_list[gal]) {
                adventureLists[index].content_list[gal] = {};
              }

              adventureLists[index].content_list[gal].image = gal_item;
            });
          }
        });
      }
    }

    // Handle slider images in the overview section
    if (req.body.overview) {
      req.body.overview['slider_images_tmp'] = slider_images.length > 0 ? slider_images : [];

      if(req.body.overview_slider_images_old){
        req.body.overview['slider_images'] = req.body.overview_slider_images_old.concat(req.body.overview['slider_images_tmp']);
      }
    }

    // Prepare the updated destination data
    let destData: any = {};

    if (req.body.overview) {
      destData = {
        'title': req.body.title,
        'sub_title': req.body.sub_title,
        'destination_location': req.body.destination_location,
        'image': req.body.image,
        'overview': {
          'banners': req.body.overview_banners || [],
          'about_title': req.body.overview.about_title,
          'about_content': req.body.overview.about_content,
          'button_text': req.body.overview.button_text,
          'button_link': req.body.overview.button_link,
          'slider_images': req.body.overview.slider_images || [],
          'sections': req.body.about_sections || [],
          'quick_facts_background': req.body.overview.quick_facts_background,
          'quick_facts_title': req.body.overview.quick_facts_title,
          'facts': req.body.facts,
          'faq': req.body.faq,
          'adventure_posts': req.body.overview?.adventure_posts || [],
          'feature_resorts': {
            'title': req.body.overview.feature_resorts_title,
            'resorts': req.body.overview.feature_resorts || []
          }
        },
        'meta_description': req.body.meta_description,
        'meta_keywords': req.body.meta_keywords,
        'meta_title': req.body.meta_title,
        'page_url': req.body.page_url,
        'author': req.body.author,
        'publisher': req.body.publisher,
        'copyright': req.body.copyright,
        'rating': req.body.rating,
        'revisit_after': req.body.revisit_after,
        'robots': req.body.robots,
        'classification': req.body.classification,
        'share_button_link': req.body.share_button_link,
        'share_button_text': req.body.share_button_text,
        'share_sub_title': req.body.share_sub_title,
        'share_title': req.body.share_title,
        'subscribe_button_link': req.body.subscribe_button_link,
        'subscribe_button_text': req.body.subscribe_button_text,
        'subscribe_sub_title': req.body.subscribe_sub_title,
        'subscribe_title': req.body.subscribe_title,
      };

      let uniqueSlug = req.body.page_url
      let counter = 1;
      while (
        await Destination.findOne({
          page_url: uniqueSlug,
          _id: { $ne: _id }
        })
      ) {
        uniqueSlug = `${req.body.page_url}-${counter}`;
        counter++;
      }

      destData.page_url = uniqueSlug;
    }

    if (req.body.is_adventures_tab) {
      destData.adventures = req.body.adventures;
      destData.adventures.adventure_lists = adventureLists;
    }

    if (req.body.resorts) {
      // req.body.resorts.resorts = resorts;
      destData.resorts = req.body.resorts;
      destData.resorts.resorts = resorts;
    }

    if (req.body.stories) {
      // req.body.resorts.resorts = resorts;
      destData.stories = req.body.stories;
      destData.stories.stories = stroiesList;
    }

    // Update the destination with the new data
    const _destination = await Destination.findByIdAndUpdate(
      _id,
      { $set: { ...destData } },
      { new: true }
    );

    // Return the updated destination as a response
    return res.status(config.statusCode.SUCCESS).json({ success: true, data: _destination });
  } catch (error) {
    next(error);  // Pass the error to the error handler
  }
}


export async function deleteDestination(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const _id = new Types.ObjectId(req.params.id);

    const destination = await Destination.findOne({
      _id: _id,
    });

    if (!destination)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Destination with this id not found",
        "deleteDestination"
      );

    const _del = await Destination.findByIdAndDelete(_id);

    return res.status(config.statusCode.SUCCESS).json({ success: true, destination });
  } catch (error) {
    next(error)
  }
}

export async function getDestinationBySlug(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pgeSlug = req.params.slug;
    const data = await Destination.findOne({
      page_url: pgeSlug,
    });

    if (!data)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Destination not found",
        "getDestinationBySlug"
      );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data });
  } catch (error) {
    next(error)
  }
}

export async function getAllResortsList(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const destinations = await Destination.find();

    const allResorts: any = [];

    destinations.forEach((destination: any) => {
      if (destination.resorts && destination.resorts.resorts) {
        destination.resorts.resorts.forEach((resort: any) => {
          allResorts.push({
            resort_id: resort._id,
            resort_title: resort.title,
            destination_id: destination._id,
            destination_title: destination.title
          });
        });
      }
    });

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: allResorts });
  } catch (error) {
    console.error('Error fetching embedded resorts:', error);
    throw error;
  }
};

export async function getResortsByIds(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const idsParam = req.query.resort_ids as string;
    if (!idsParam) return res.json({ data: [] });

    const resortIds = idsParam.split(',');
    const validIds = resortIds.filter((id: string) => mongoose.Types.ObjectId.isValid(id));

    const destinations = await Destination.find({
      "resorts.resorts._id": { $in: validIds }
    });

    if (!destinations.length) {
      return [];
    }

    const allResorts: any = [];
    destinations.forEach((destination: any) => {
      if (destination.resorts && destination.resorts.resorts) {
        allResorts.push(...destination.resorts.resorts);
      }
    });

    const requestedResorts = allResorts.filter( (resort: any) => 
      resortIds.includes(resort._id.toString())
    );

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: requestedResorts });
  } catch (error) {
    console.error('Error fetching resorts by IDs:', error);
    throw error;
  }
};


// New Mapping on Destinations and Resorts by Tags
export async function filterResortsByDestination(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { destination_location } = req.body;

    if (!destination_location) {
      return res.status(400).json({
        success: false,
        message: "destination_location is required",
      });
    }

    // 1. Fetch all destinations with that location
    const destinations = await Destination.find({
      destination_location: destination_location
    });

    if (!destinations.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No destinations found for this location",
      });
    }

    // 2. Collect all resort_tags from all destinations
    let allTags: string[] = [];

    destinations.forEach(dest => {
      const tags = dest?.resorts?.resort_tags || [];
      allTags.push(...tags);
    });

    // 3. Remove duplicates
    const uniqueTags = [...new Set(allTags)];

    if (!uniqueTags.length) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No resort tags found for these destinations",
      });
    }

    // 4. Fetch all resorts that match ANY tag
    const matchedResorts = await Resorts.find({
      tags: { $in: uniqueTags }
    });

    return res.status(200).json({
      success: true,
      tags_used: uniqueTags,
      total_resorts: matchedResorts.length,
      data: matchedResorts
    });

  } catch (error) {
    next(error);
  }
}


export async function filterDestinationsByTags(req: Request, res: Response, next: NextFunction) {
  try {

    const { location, resort } = req.body;

    const query: any = {};

    // Filter by location if provided
    if (location) {
      query.destination_location = location;
    }

    // If resort is selected, fetch its tags first
    let resortTags: string[] = [];

    if (resort && resort !== "Any Resorts") {
      const selectedResort = await Resorts.findOne({ name: resort });

      if (!selectedResort) {
        return res.status(200).json({ success: true, data: [] });
      }

      resortTags = selectedResort.tags || [];

      // Now add tag matching condition
      query["resorts.resort_tags"] = { $in: resortTags };
    }

    // Final MongoDB query
    const destinations = await Destination.find(query);

    return res.status(200).json({
      success: true,
      data: destinations
    });

  } catch (error) {
    next(error);
  }
}

