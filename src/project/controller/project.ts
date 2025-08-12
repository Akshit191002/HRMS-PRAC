import * as admin from 'firebase-admin';
import { Project } from '../models/project';
import { Resources } from '../models/resouces';

const db = admin.firestore();

const projectCollection = db.collection('projects');

export const createProject = async (data: Project) => {
  const docRef = projectCollection.doc();
  const project = { id: docRef.id, ...data, isDeleted: false, teamMember: 0 };

  await docRef.set(project);

  return {
    message: 'Project created successfully',
    project: project,
  };
};

export const getProject = async (id: string) => {
  const projectRef = db.collection('projects').doc(id);
  const projectSnap = await projectRef.get();

  if (!projectSnap.exists) {
    throw new Error('Project not found');
  }

  const projectData = projectSnap.data() as Project;

  if (projectData.isDeleted) {
    throw new Error('Project has been deleted');
  }
  const resourceEmpCodes: string[] = projectData.resources || [];

  const resourcePromises = resourceEmpCodes.map(async (empCode) => {
    const snap = await db
      .collection('resources')
      .where('isDeleted', '==', false)
      .where('empCode', '==', empCode)
      .limit(1)
      .get();

    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() };
    }

    return null;
  });

  const resourceDetails = (await Promise.all(resourcePromises)).filter(Boolean);

  return {
    id: projectSnap.id,
    ...projectData,
    resources: resourceDetails
  };
};

export const allocateEmployeeToProject = async (projectId: string, allocation: Resources) => {
  const allocationRef = db.collection('resources').doc();
  const projectRef = db.collection('projects').doc(projectId);

  const generalSnap = await db
    .collection('general')
    .where('empCode', '==', allocation.empCode)
    .limit(1)
    .get();

  if (generalSnap.empty) {
    throw new Error(`No Employee Found with this ${allocation.empCode}`);
  }

  const generalDoc = generalSnap.docs[0];
  const generalData = generalDoc.data();
  const generalId = generalDoc.id;

  const employeeSnap = await db
    .collection('employees')
    .where('generalId', '==', generalId)
    .limit(1)
    .get();

  const employeeDoc = employeeSnap.docs[0]
  const employeeId = employeeDoc.id;

  const employeeData = employeeDoc.data();
  const professionalSnap = await db.collection('professional').doc(employeeData.professionalId)
  const pro = await professionalSnap.get();
  const professionalData = pro.data()
  if (!professionalData) throw Error
  console.log(professionalData)
  const nameMatches = generalData.name.first.trim().toLowerCase() === allocation.name.trim().toLowerCase();
  const departmentMatches = professionalData.department?.trim().toLowerCase() === allocation.department.trim().toLowerCase();
  const designationMatches = professionalData.designation?.trim().toLowerCase() === allocation.designation.trim().toLowerCase();

  if (!nameMatches) {
    throw new Error(`Name mismatch: expected "${generalData.name}", got "${allocation.name}"`);
  }

  if (!departmentMatches) {
    throw new Error(`Department mismatch: expected "${professionalData.department}", got "${allocation.department}"`);
  }

  if (!designationMatches) {
    throw new Error(`Designation mismatch: expected "${professionalData.designation}", got "${allocation.designation}"`);
  }

  const employeeRef = db.collection('employees').doc(employeeId);
  const projectSnap = await projectRef.get();
  if (!projectSnap.exists) {
    throw new Error(`Project with ID ${projectId} does not exist`);
  }
  const projectData = projectSnap.data();
  const currentTeamCount = projectData?.teamMember || 0;

  const batch = db.batch();
  batch.set(allocationRef, {
    id: allocationRef.id,
    ...allocation
  });

  batch.update(projectRef, {
    resources: admin.firestore.FieldValue.arrayUnion(allocation.empCode),
    teamMember: currentTeamCount + 1,
  });

  batch.update(employeeRef, {
    projectId: admin.firestore.FieldValue.arrayUnion(allocationRef.id)
  });

  await batch.commit();

  return {
    message: 'Employee allocated successfully',
    allocationId: allocationRef.id
  };
};

export const editProject = async (id: string, data: Partial<Project>) => {
  const projectRef = db.collection('projects').doc(id);
  const projectSnap = await projectRef.get();

  if (!projectSnap.exists) {
    throw new Error(`Project with id ${id} does not exist`);
  }

  await projectRef.update({
    ...data,
  });

  return {
    message: 'Project updated successfully',
    projectId: id
  };
};

export const deleteProject = async (id: string) => {
  const projectRef = db.collection('projects').doc(id);
  const projectSnap = await projectRef.get();

  if (!projectSnap.exists) {
    throw new Error(`Project with id ${id} does not exist`);
  }

  const projectData = projectSnap.data();

  const resourceEmpCodes: string[] = projectData?.resources || [];

  const batch = db.batch();

  batch.update(projectRef, {
    isDeleted: true,
  });

  for (const empCode of resourceEmpCodes) {
    const resSnap = await db
      .collection('resources')
      .where('empCode', '==', empCode)
      .limit(1)
      .get();

    if (!resSnap.empty) {
      const resDoc = resSnap.docs[0];
      batch.update(resDoc.ref, {
        isDeleted: true,
      });
    }
  }

  await batch.commit();

  return {
    message: 'Project and associated resources deleted successfully',
    projectId: id
  };
};

export const getAllProjects = async () => {
  const snapshot = await db.collection("projects").where("isDeleted", "!=", true).get();
  const projects = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  return projects;
};

export const editResources = async (id: string, updatedData: Partial<Resources>) => {
  const resourceRef = db.collection('resources').doc(id);
  const resourceSnap = await resourceRef.get();

  if (!resourceSnap.exists) {
    throw new Error(`Resource with ID ${id} not found`);
  }

  await resourceRef.update(updatedData);

  return {
    message: 'Resource allocation updated successfully',
    resourceId: id,
    updatedFields: updatedData,
  };
};

