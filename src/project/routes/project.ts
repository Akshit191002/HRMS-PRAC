import express from "express";
import * as projectController from '../controller/project';
// import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";

const route = express.Router()

route.post('/project', async (req, res) => {
  try {
    const project = await projectController.createProject(req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

route.get('/project', async (req, res) => {
  try {
    const project = await projectController.getAllProjects();
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

route.get('/project/:id', async (req, res) => {
  try {
    const project = await projectController.getProject(req.params.id);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

route.post('/project/:id', async (req, res) => {
  try {
    const project = await projectController.allocateEmployeeToProject(req.params.id,req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

route.patch('/project/:id', async (req, res) => {
  try {
    const project = await projectController.editProject(req.params.id,req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

route.patch('/project/resources/:id', async (req, res) => {
  try {
    const project = await projectController.editResources(req.params.id,req.body);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

route.delete('/project/:id', async (req, res) => {
  try {
    const project = await projectController.deleteProject(req.params.id);
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default route;
