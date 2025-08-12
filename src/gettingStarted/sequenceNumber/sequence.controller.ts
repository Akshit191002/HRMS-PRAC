import { Request, Response } from "express";
import { createSequence, getAllSequences } from "./sequence.service";
import { SequenceNumber } from "./sequence.model";

export const addSequence = async (req: Request, res: Response) => {
  try {
    const { type, prefix, nextAvailableNumber } = req.body;

    if (!req.user || !req.user.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const newSequence: SequenceNumber = {
      type: type.trim(),
      prefix: prefix.trim(),
      nextAvailableNumber: Number(nextAvailableNumber),
      createdBy: req.user.uid,
      createdAt: new Date().toISOString(),
    };

    const id = await createSequence(newSequence);
    return res.status(201).json({ message: "Sequence created", id });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to create sequence",
      error: error.message,
    });
  }
};

export const fetchSequences = async (_req: Request, res: Response) => {
  try {
    const data = await getAllSequences();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to fetch sequences",
      error: error.message,
    });
  }
};
