import { Request, Response } from "express";
import {
  createLocation,
  deleteLocation,
  getAllLocations,
  updateLocation,
} from "./location.service";
import { Location } from "./location.model";
import logger from "../../utils/logger";

export const addLocation = async (req: Request, res: Response) => {
  try {
    const { cityName, code, state, status } = req.body;

    if (!req.user || !req.user.uid) {
      logger.warn("Unauthorized attempt to add location");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newLocation: Location = {
      cityName: cityName.trim(),
      code: code.trim(),
      state: state.trim(),
      status: status === "active" ? "active" : "inactive",
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const id = await createLocation(newLocation);
    logger.info(`Location created by UID: ${req.user.uid} with ID: ${id}`);
    return res.status(201).json({ message: "Location created", id });
  } catch (error: any) {
    logger.error(`Failed to create location: ${error.message}`);
    return res.status(500).json({
      message: "Failed to create location",
      error: error.message,
    });
  }
};

export const fetchLocations = async (_req: Request, res: Response) => {
  try {
    const data = await getAllLocations();
    logger.info("Fetched all locations");
    return res.status(200).json(data);
  } catch (error: any) {
    logger.error(`Failed to fetch locations: ${error.message}`);
    return res.status(500).json({
      message: "Failed to fetch locations",
      error: error.message,
    });
  }
};

export const updateLocationHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cityName, code, state, status } = req.body;

    const updates: Partial<Location> = {
      ...(cityName && { cityName: cityName.trim() }),
      ...(code && { code: code.trim() }),
      ...(state && { state: state.trim() }),
      ...(status && { status }),
    };

    const success = await updateLocation(id, updates);

    if (!success) {
      logger.warn(`Update failed: Location not found (ID: ${id})`);
      return res.status(404).json({ message: "Location not found" });
    }
    logger.info(`Location updated successfully (ID: ${id})`);
    return res.status(200).json({ message: "Location updated successfully" });
  } catch (error: any) {
    logger.error(`Failed to update location: ${error.message}`);
    return res.status(500).json({
      message: "Failed to update location",
      error: error.message,
    });
  }
};

export const deleteLocationHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteLocation(id);

    if (!success) {
      logger.warn(`Delete failed: Location not found (ID: ${id})`);
      return res.status(404).json({ message: "Location not found" });
    }
    logger.info(`Location status toggled successfully (ID: ${id})`);
    return res.status(200).json({ message: "Location marked as inactive" });
  } catch (error: any) {
    logger.error(`Failed to inactivate location: ${error.message}`);
    return res.status(500).json({
      message: "Failed to inactivate location",
      error: error.message,
    });
  }
};
