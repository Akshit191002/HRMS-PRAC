import { Request, Response } from "express";
import {
  createHoliday,
  deleteHoliday,
  getAllHolidays,
  updateHoliday,
} from "./holidayCalendar.service";
import { Holiday } from "./holidayCalendar.model";
import logger from "../../utils/logger";

export const addHoliday = async (req: Request, res: Response) => {
  try {
    const { name, type, date, holidayGroups } = req.body;

    if (!req.user || !req.user.uid) {
      logger.warn("Unauthorized attempt to create holiday");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newHoliday: Holiday = {
      name: name.trim(),
      type: type.trim(),
      date: new Date(date).toISOString(),
      holidayGroups,
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const id = await createHoliday(newHoliday);
    logger.info(`Holiday created by UID: ${req.user.uid}, ID: ${id}`);
    return res.status(201).json({ message: "Holiday created", id });
  } catch (error: any) {
    logger.error(`Failed to create holiday: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to create holiday", error: error.message });
  }
};

export const fetchHolidays = async (_req: Request, res: Response) => {
  try {
    const data = await getAllHolidays();
    logger.info("Fetched all holidays");
    return res.status(200).json(data);
  } catch (error: any) {
    logger.error(`Failed to fetch holidays: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to fetch holidays", error: error.message });
  }
};

export const updateHolidayHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, date, holidayGroups } = req.body;

    const updates: Partial<Holiday> = {
      ...(name && { name: name.trim() }),
      ...(type && { type: type.trim() }),
      ...(date && { date: new Date(date).toISOString() }),
      ...(holidayGroups && { holidayGroups }),
    };

    const success = await updateHoliday(id, updates);
    if (!success) {
      logger.warn(`Holiday not found for update. ID: ${id}`);
      return res.status(404).json({ message: "Holiday not found" });
    }
    logger.info(`Holiday updated successfully. ID: ${id}`);
    return res.status(200).json({ message: "Holiday updated successfully" });
  } catch (error: any) {
    logger.error(`Failed to update holiday: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to update holiday", error: error.message });
  }
};

export const deleteHolidayHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await deleteHoliday(id);

    if (!success) {
      logger.warn(`Holiday not found for deletion. ID: ${id}`);
      return res.status(404).json({ message: "Holiday not found" });
    }
    logger.info(`Holiday deleted successfully. ID: ${id}`);
    return res.status(200).json({ message: "Holiday deleted successfully" });
  } catch (error: any) {
    logger.error(`Failed to delete holiday: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Failed to delete holiday", error: error.message });
  }
};
