import { ITours, ITourCategories, ITourDetails } from "../interfaces/tours";
import { Request, Response, NextFunction } from "express";
import mongoose, { Types } from "mongoose";
import HttpException from "../utils/http.exception";
import config from "../configs/constants";

const Tours = mongoose.model("Tours");
const TourDetails = mongoose.model("TourDetails");
const TourCategories = mongoose.model("TourCategories");
const TourActivities = mongoose.model("TourActivities");
const CustomCategories = mongoose.model("CustomCategories");

export async function getUniqueLocations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const today = new Date();

    const uniqueLocations = await Tours.distinct("locations", {
      "departures.start_date": { $gt: today }
    });

    // Sort alphabetically (case-insensitive)
    /*const sortedLocations = uniqueLocations.sort((a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );*/

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: uniqueLocations });
  } catch (error) {
    next(error);
  }
}

export async function getUniqueActivities(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const today = new Date();

    const uniqueActivities = await Tours.distinct("departures.activities", {
      "departures.start_date": { $gt: today }
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: uniqueActivities });
  } catch (error) {
    next(error);
  }
}

export async function getDestinationsByActivity(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { activity } = req.query;
    const today = new Date();

    if (!activity) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: true, data: [] });
    }

    const uniqueLocations = await Tours.distinct("locations", {
      "departures.activities": activity,
      "departures.start_date": { $gt: today }
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: uniqueLocations });
  } catch (error) {
    next(error);
  }
}


export async function getUsedCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const today = new Date();
    const usedCategoryIds = await Tours.distinct("api_category_ids", {
      "departures.start_date": { $gt: today }
    });

    const categories = await TourCategories.find({
      api_category_id: { $in: usedCategoryIds },
    });
    //"api_resource": "gadventures",
    //"api_parent_id": 16,

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function getDestinationsByCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { category_id } = req.query;
    const today = new Date();

    if (!category_id) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: true, data: [] });
    }

    const uniqueLocations = await Tours.distinct("locations", {
      "api_category_ids": category_id,
      "departures.start_date": { $gt: today }
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: uniqueLocations });
  } catch (error) {
    next(error);
  }
}




export async function getCustomCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let custom_categories:any = [];
    custom_categories = await CustomCategories.find().sort({ category_name: 1 });
    
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: custom_categories });

  } catch (error) {
    next(error);
  }
}

export async function getDestinationsByCustomCategory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { category_id } = req.query;
    const today = new Date();

    if (!category_id) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: true, data: [] });
    }

    const singleCategory = await CustomCategories.findOne({ _id: category_id });

    if (!singleCategory) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: true, data: [] });
    }

    const patterns: string[] = Array.isArray(singleCategory.search_pattern)
      ? singleCategory.search_pattern
      : [singleCategory.search_pattern];

    // Convert patterns into Mongo-compatible regex objects
    const regexConditions: any[] = [];
    patterns.forEach((p) => {
      if (!p) return;

      // Extract inline flags like (?i), (?si)
      const flagMatch = p.match(/^\(\?([a-z]+)\)/i);
      let options = "";
      let cleanPattern = p;

      if (flagMatch) {
        options = flagMatch[1]; // e.g. "i", "si"
        cleanPattern = p.replace(/^\(\?[a-z]+\)/i, ""); // remove inline flag
      }

      // Build regex condition (case-insensitive, etc.)
      const regex = { $regex: cleanPattern, $options: options };
      regexConditions.push(regex);
    });

    // Build $or matches for all regex conditions across fields
    const orMatches: any[] = [];
    regexConditions.forEach((rc) => {
      orMatches.push({ name: rc });
      orMatches.push({ description: rc });
      orMatches.push({ "details.days_summary.label": rc });
      orMatches.push({ "details.days_summary.summary": rc });
      orMatches.push({ "details.days_summary.components.name": rc });
      orMatches.push({ "details.days_summary.components.summary": rc });
    });

    // Aggregation pipeline
    const result = await Tours.aggregate([
      {
        $match: {
          "departures.start_date": { $gt: today }
        }
      },
      {
        $lookup: {
          from: "tourdetails", // collection name for tourdetails
          localField: "_id",
          foreignField: "ref_tour_id",
          as: "details"
        }
      },
      {
        $match: orMatches.length > 0 ? { $or: orMatches } : {}
      },
      { $sort: { age: -1 } },
      { $unwind: "$locations" },
      { $group: { _id: null, uniqueLocations: { $addToSet: "$locations" } } }
    ]);

    const uniqueLocations = result[0]?.uniqueLocations || [];


    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: uniqueLocations });

  } catch (error) {
    next(error);
  }
}



export async function filterToursCount(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const today = new Date();
    let tours: any[] = [];

    const { category, destination } = req.query;
    if (category && destination) {
      const singleCategory = await CustomCategories.findOne({ category_name: category });

      if (!singleCategory) {
        return res
          .status(config.statusCode.SUCCESS)
          .json({ success: true, count: 0 });
      }

      const patterns: string[] = Array.isArray(singleCategory.search_pattern)
      ? singleCategory.search_pattern
      : [singleCategory.search_pattern];


      // Convert patterns into Mongo-compatible regex objects
      const regexConditions: any[] = [];
      patterns.forEach((p) => {
        if (!p) return;

        // Extract inline flags like (?i), (?si)
        const flagMatch = p.match(/^\(\?([a-z]+)\)/i);
        let options = "";
        let cleanPattern = p;

        if (flagMatch) {
          options = flagMatch[1]; // e.g. "i", "si"
          cleanPattern = p.replace(/^\(\?[a-z]+\)/i, "");

          //options = options.replace(/[^imsx]/g, "");
        }

        // Build regex condition (case-insensitive, etc.)
        const regex = { $regex: cleanPattern, $options: options };
        regexConditions.push(regex);
      });

      // Build $or matches for all regex conditions across fields
      const orMatches: any[] = [];
      regexConditions.forEach((rc) => {
        orMatches.push({ name: rc });
        orMatches.push({ description: rc });
        orMatches.push({ "details.days_summary.label": rc });
        orMatches.push({ "details.days_summary.summary": rc });
        orMatches.push({ "details.days_summary.components.name": rc });
        orMatches.push({ "details.days_summary.components.summary": rc });
      });

      // Aggregation pipeline
      tours = await Tours.aggregate([
        {
          $match: {
            "locations": destination,
            "departures.start_date": { $gt: today }
          }
        },
        {
          $lookup: {
            from: "tourdetails",
            localField: "_id",
            foreignField: "ref_tour_id",
            as: "details"
          }
        },
        {
          $match: orMatches.length > 0 ? { $or: orMatches } : {}
        }
      ]);
    } else if (category) {
      const singleCategory = await CustomCategories.findOne({ category_name: category });

      if (!singleCategory) {
        return res
          .status(config.statusCode.SUCCESS)
          .json({ success: true, count: 0 });
      }

      const patterns: string[] = Array.isArray(singleCategory.search_pattern)
      ? singleCategory.search_pattern
      : [singleCategory.search_pattern];


      // Convert patterns into Mongo-compatible regex objects
      const regexConditions: any[] = [];
      patterns.forEach((p) => {
        if (!p) return;

        // Extract inline flags like (?i), (?si)
        const flagMatch = p.match(/^\(\?([a-z]+)\)/i);
        let options = "";
        let cleanPattern = p;

        if (flagMatch) {
          options = flagMatch[1]; // e.g. "i", "si"
          cleanPattern = p.replace(/^\(\?[a-z]+\)/i, "");

          //options = options.replace(/[^imsx]/g, "");
        }

        // Build regex condition (case-insensitive, etc.)
        const regex = { $regex: cleanPattern, $options: options };
        regexConditions.push(regex);
      });

      // Build $or matches for all regex conditions across fields
      const orMatches: any[] = [];
      regexConditions.forEach((rc) => {
        orMatches.push({ name: rc });
        orMatches.push({ description: rc });
        orMatches.push({ "details.days_summary.label": rc });
        orMatches.push({ "details.days_summary.summary": rc });
        orMatches.push({ "details.days_summary.components.name": rc });
        orMatches.push({ "details.days_summary.components.summary": rc });
      });

      // Aggregation pipeline
      tours = await Tours.aggregate([
        {
          $match: {
            "departures.start_date": { $gt: today }
          }
        },
        {
          $lookup: {
            from: "tourdetails",
            localField: "_id",
            foreignField: "ref_tour_id",
            as: "details"
          }
        },
        {
          $match: orMatches.length > 0 ? { $or: orMatches } : {}
        }
      ]);
    }  else if (destination) {
      tours = await Tours.aggregate([
        {
          $match: {
            "locations": destination,
            "departures.start_date": { $gt: today }
          }
        },
        {
          $lookup: {
            from: "tourdetails",
            localField: "_id",
            foreignField: "ref_tour_id",
            as: "details"
          }
        }
      ]);
    } else {
      tours = await Tours.aggregate([
        {
          $match: {
            "departures.start_date": { $gt: today }
          }
        },
        {
          $lookup: {
            from: "tourdetails",
            localField: "_id",
            foreignField: "ref_tour_id",
            as: "details"
          }
        }
      ]);
    }

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, count: tours.length });
  } catch (error) {
    next(error);
  }
}

export async function filterTours(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;
    const today = new Date();
    let tours: any[] = [];

    const { category, destination } = req.query;

    if (category && destination) {
      const singleCategory = await CustomCategories.findOne({ category_name: category });

      if (!singleCategory) {
        return res
          .status(config.statusCode.SUCCESS)
          .json({ success: true, data: tours });
      }

      const patterns: string[] = Array.isArray(singleCategory.search_pattern)
      ? singleCategory.search_pattern
      : [singleCategory.search_pattern];

      // Convert patterns into Mongo-compatible regex objects
      const regexConditions: any[] = [];
      patterns.forEach((p) => {
        if (!p) return;

        // Extract inline flags like (?i), (?si)
        const flagMatch = p.match(/^\(\?([a-z]+)\)/i);
        let options = "";
        let cleanPattern = p;

        if (flagMatch) {
          options = flagMatch[1]; // e.g. "i", "si"
          cleanPattern = p.replace(/^\(\?[a-z]+\)/i, "");
        }

        // Build regex condition (case-insensitive, etc.)
        const regex = { $regex: cleanPattern, $options: options };
        regexConditions.push(regex);
      });

      // Build $or matches for all regex conditions across fields
      const orMatches: any[] = [];
      regexConditions.forEach((rc) => {
        orMatches.push({ name: rc });
        orMatches.push({ description: rc });
        orMatches.push({ "details.days_summary.label": rc });
        orMatches.push({ "details.days_summary.summary": rc });
        orMatches.push({ "details.days_summary.components.name": rc });
        orMatches.push({ "details.days_summary.components.summary": rc });
      });

      // Aggregation pipeline
      tours = await Tours.aggregate([
        {
          $match: {
            "locations": destination,
            "departures.start_date": { $gt: today }
          }
        },
        {
          $lookup: {
            from: "tourdetails",
            localField: "_id",
            foreignField: "ref_tour_id",
            as: "details"
          }
        },
        {
          $match: orMatches.length > 0 ? { $or: orMatches } : {}
        }
      ]).sort({ "departures.start_date": 1 })
      .skip(skip)
      .limit(limit);
    } else if (category) {
      const singleCategory = await CustomCategories.findOne({ category_name: category });

      if (!singleCategory) {
        return res
          .status(config.statusCode.SUCCESS)
          .json({ success: true, data: tours });
      }

      const patterns: string[] = Array.isArray(singleCategory.search_pattern)
      ? singleCategory.search_pattern
      : [singleCategory.search_pattern];

      // Convert patterns into Mongo-compatible regex objects
      const regexConditions: any[] = [];
      patterns.forEach((p) => {
        if (!p) return;

        // Extract inline flags like (?i), (?si)
        const flagMatch = p.match(/^\(\?([a-z]+)\)/i);
        let options = "";
        let cleanPattern = p;

        if (flagMatch) {
          options = flagMatch[1]; // e.g. "i", "si"
          cleanPattern = p.replace(/^\(\?[a-z]+\)/i, "");
        }

        // Build regex condition (case-insensitive, etc.)
        const regex = { $regex: cleanPattern, $options: options };
        regexConditions.push(regex);
      });

      // Build $or matches for all regex conditions across fields
      const orMatches: any[] = [];
      regexConditions.forEach((rc) => {
        orMatches.push({ name: rc });
        orMatches.push({ description: rc });
        orMatches.push({ "details.days_summary.label": rc });
        orMatches.push({ "details.days_summary.summary": rc });
        orMatches.push({ "details.days_summary.components.name": rc });
        orMatches.push({ "details.days_summary.components.summary": rc });
      });

      // Aggregation pipeline
      tours = await Tours.aggregate([
        {
          $match: {
            "departures.start_date": { $gt: today }
          }
        },
        {
          $lookup: {
            from: "tourdetails",
            localField: "_id",
            foreignField: "ref_tour_id",
            as: "details"
          }
        },
        {
          $match: orMatches.length > 0 ? { $or: orMatches } : {}
        }
      ]).sort({ "departures.start_date": 1 })
      .skip(skip)
      .limit(limit);
    } else if (destination) {
      // Aggregation pipeline
      tours = await Tours.aggregate([
        {
          $match: {
            "locations": destination,
            "departures.start_date": { $gt: today }
          }
        },
        {
          $lookup: {
            from: "tourdetails",
            localField: "_id",
            foreignField: "ref_tour_id",
            as: "details"
          }
        }
      ]).sort({ "departures.start_date": 1 })
      .skip(skip)
      .limit(limit);
    } else {
      tours = await Tours.aggregate([
        {
          $match: {
            "departures.start_date": { $gt: today }
          }
        },
        {
          $lookup: {
            from: "tourdetails",
            localField: "_id",
            foreignField: "ref_tour_id",
            as: "details"
          }
        }
      ]).sort({ "departures.start_date": 1 })
      .skip(skip)
      .limit(limit);
    }

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: tours });
  } catch (error) {
    next(error);
  }
}


// FRONTEND TOUR DETAILS SCREEN

export async function getAllCategories(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const categories = await TourCategories.find();

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
}

export async function getTourBySlug(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { slug } = req.query;

    if (!slug) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: true, data: [] });
    }

    const singleTour = await Tours.findOne({
      "slug": slug
    });

    const tourDetail = await TourDetails.findOne({
      "ref_tour_id": singleTour._id
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: singleTour, tour_details: tourDetail });
  } catch (error) {
    next(error);
  }
}

export async function getTourById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tour_id = req.params.tour_id;

    console.log("Tour :: ", tour_id);

    if (!tour_id) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: true, data: [] });
    }

    const singleTour = await Tours.findOne({
      "api_tour_id": tour_id
    });

    const tourDetail = await TourDetails.findOne({
      "ref_tour_id": singleTour._id
    });

    console.log(singleTour, tourDetail);

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: singleTour, tour_details: tourDetail });
  } catch (error) {
    next(error);
  }
}

export async function getActivitiesByIds(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    //const { activity_ids } = req.query;
    const idsParam = req.query.activity_ids as string;
    if (!idsParam) return res.json({ data: [] });

    const ids = idsParam.split(',').map(Number);

    const activities = await TourActivities.find({
      api_activity_id: { $in: ids }
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
}

export async function listAll(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { fields } = req.query;
    
    let result: any = [];
    let query = Tours.find().sort({ name: 1 });

    if (fields && typeof fields === 'string') {
      const fieldArray = fields.split(',').map(field => field.trim());
      query = query.select(fieldArray);
    }

    result = await query;

    return res.status(config.statusCode.SUCCESS).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getToursByIds(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const idsParam = req.query.tours_ids as string;
    if (!idsParam) return res.json({ data: [] });

    const ids = idsParam.split(',');
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    // Fetch tours
    const _tours = await Tours.find({
      _id: { $in: validIds }
    });

    // Fetch tour details using the valid tour IDs
    const _tourDetails = await TourDetails.find({
      ref_tour_id: { $in: validIds }
    });

    // Combine tours with their details
    const toursWithDetails = _tours.map(tour => {
      const tourDetail = _tourDetails.find(detail => 
        detail.ref_tour_id === tour._id.toString()
      );
      
      return {
        ...tour.toObject(),
        details: tourDetail || null
      };
    });

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: toursWithDetails });
  } catch (error) {
    next(error);
  }
}

// Property Owner Routes

export async function getUserProperties(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    var _id = null;

    // Start with basic filter
    const query: any = {};

    if (req.params.id != '0') {
      _id = new Types.ObjectId(req.params.id);
      query.user_id = _id;
    }

    const tours = await Tours.find(query);

    console.log("Property Tours: ", tours);

    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: tours });
  } catch (error) {
    next(error);
  }
}

export async function getTourActivities(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
      const activities = await TourActivities.find().sort({ activity_name: 1 });

      return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
}


export async function getCustomCategoryByDestination(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { location_name } = req.query;
    const today = new Date();

    if (!location_name) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: true, data: [] });
    }


    // 1. Fetch all Tours with upcoming departures + location + join tourdetails
    const tours = await Tours.aggregate([
      {
        $match: {
          locations: { $in: [location_name] },
          "departures.start_date": { $gt: today }
        }
      },
      {
        $lookup: {
          from: "tourdetails",
          localField: "_id",
          foreignField: "ref_tour_id",
          as: "details"
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          locations: 1,
          details: 1
        }
      }
    ]);

    if (!tours.length) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: true, data: [] });
    }


    // 2. Flatten all fields we want to match
    const searchStrings: string[] = [];

    tours.forEach((tour: any) => {
      if (tour.name) searchStrings.push(tour.name);
      if (tour.description) searchStrings.push(tour.description);

      if (Array.isArray(tour.details)) {
        tour.details.forEach((detail: any) => {
          if (Array.isArray(detail.days_summary)) {
            detail.days_summary.forEach((day: any) => {
              if (day.label) searchStrings.push(day.label);
              if (day.summary) searchStrings.push(day.summary);

              if (Array.isArray(day.components)) {
                day.components.forEach((comp: any) => {
                  if (comp.name) searchStrings.push(comp.name);
                  if (comp.summary) searchStrings.push(comp.summary);
                });
              }
            });
          }
        });
      }
    });

    if (!searchStrings.length) {
      return res
        .status(config.statusCode.SUCCESS)
        .json({ success: true, data: [] });
    }


    // 3. Fetch all CustomCategories
    const customCategories = await CustomCategories.find({});

    const matchingCategories: any[] = [];

    customCategories.forEach((cat) => {
      const patterns: string[] = Array.isArray(cat.search_pattern)
        ? cat.search_pattern
        : [cat.search_pattern];

      // For each pattern, build regex
      const regexList = patterns
        .filter((p) => !!p)
        .map((p) => {
          const flagMatch = p.match(/^\(\?([a-z]+)\)/i);
          let options = "";
          let cleanPattern = p;

          if (flagMatch) {
            options = flagMatch[1];
            cleanPattern = p.replace(/^\(\?[a-z]+\)/i, "");
          }

          return new RegExp(cleanPattern, options);
        });

      // Check if any of the regex matches any tour field
      const isMatch = searchStrings.some((str) =>
        regexList.some((regex) => regex.test(str))
      );

      if (isMatch) matchingCategories.push(cat);
    });


    // 4. Return unique categories
    return res
      .status(config.statusCode.SUCCESS)
      .json({ success: true, data: matchingCategories });

  } catch (error) {
    next(error);
  }
}

export async function getToursByLocation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const location = req.body?.location;
    
    if (!location)
      throw new HttpException(
        config.statusCode.NOTFOUND,
        "Tag(s) not found in request body",
        "getToursByLocation"
      );

    let locationArray: string[];
    if (Array.isArray(location)) {
      locationArray = location;
    } else if (typeof location === 'string') {
      locationArray = location.split(',').map(lc => lc.trim());
    } else {
      throw new HttpException(
        config.statusCode.BAD_REQUEST,
        "location must be a string or array",
        "getToursByLocation"
      );
    }

    locationArray = locationArray.filter(lc => lc.length > 0);
    
    if (locationArray.length === 0) {
      throw new HttpException(
        config.statusCode.BAD_REQUEST,
        "No valid location provided",
        "getToursByLocation"
      );
    }

    const fields = req.body?.fields as string;
    let selectFields = '';
    
    if (fields) {
      selectFields = fields.split(',').map(field => field.trim()).join(' ');
    } else {
      selectFields = 'id name locations image slug description';
    }

    const locationPatterns = locationArray.map(lc => new RegExp(`^${lc}$`, 'i'));

    const toursLists = await Tours.find({
      locations: { 
        $exists: true,
        $ne: null,
        $in: locationPatterns
      }
    }).select(selectFields)
    .limit(5);

    return res.status(config.statusCode.SUCCESS).json({
      success: true,
      count: toursLists.length,
      data: toursLists,
      requestedLocations: locationArray,
      matchedLocationsCount: locationArray.length
    });
  } catch (error) {
    next(error);
  }
};