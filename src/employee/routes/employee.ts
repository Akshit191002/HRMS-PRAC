import express from "express";
import * as employeeController from '../controller/employee';
import * as loanController from '../../loanAdvanced/controller/loan'
import { authenticateFirebaseUser } from "../../auth/middlewares/authenticateFirebaseUser";
import { BankDetailsSchema, changeStatusSchema, CreateEmployeeSchema, editGeneralInfoSchema, loginDetailsSchema, updateLoginDetailsSchema } from "../models/zodValidation/employee";
import { Gender, Title } from "../models/employees/employee.general";

const route = express.Router()
route.post('/employees', authenticateFirebaseUser, async (req, res) => {
  try {
    const parsed = CreateEmployeeSchema.safeParse(req.body);
    console.log(parsed)
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid employee data",
        details: parsed.error.format()
      });
    }

    let { title, firstName, lastName, email, gender, phone, joiningDate, department, designation, role, location, reportingManager, workingPattern, holidayGroup, ctc, payslipComponent } = parsed.data;

    console.log("done....")
    const empCode = await employeeController.generateEmpId(department);
    if (!lastName) {
      lastName = firstName;
    }

    const generalData = {
      empCode,
      name: {
        title: title as Title,
        first: firstName.trim(),
        last: lastName.trim()
      },
      primaryEmail: email,
      gender: gender as Gender,
      phoneNum: {
        code: "+91",
        num: phone
      }
    };

    const professionalData = {
      joiningDate, department,
      designation, location,
      reportingManager, holidayGroup,
      workWeek: workingPattern,
      ctcAnnual: ctc, role,
      payslipComponent
    };

    const employee = await employeeController.addEmployee(generalData, professionalData);
    res.status(201).json(employee);

  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

route.get('/employees', authenticateFirebaseUser, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;

    if (isNaN(limit) || isNaN(page)) {
      return res.status(400).json({ error: "Invalid or missing 'limit' or 'page' query parameters" });
    }

    const employees = await employeeController.getAllEmployees(limit, page);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

route.get('/employees/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const data = await employeeController.getEmployeeById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
});

route.patch('/employees/status/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const parsed = changeStatusSchema.parse(req.body);
    const status = parsed.status;
    if (!status) throw new Error("Status is required");

    const data = await employeeController.changeStatus(req.params.id, status);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
})

route.delete('/employees/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const data = await employeeController.deleteEmployee(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
})

route.patch('/employees/general/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const parsed = editGeneralInfoSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid employee data",
        details: parsed.error.format()
      });
    }
    
    const updated = await employeeController.editGeneralInfo(req.params.id, parsed.data);
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

route.patch('/employees/general/login-details/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const parsed = updateLoginDetailsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid login details",
        details: parsed.error.format()
      });
    }

    const updated = await employeeController.editLoginDetails(req.params.id, parsed.data);
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

route.post('/employees/general/login-details/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const parsed = loginDetailsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid login details",
        details: parsed.error.format()
      });
    }

    const updated = await employeeController.addLoginDetails(req.params.id, parsed.data);
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
})

route.patch('/employees/professional/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const updated = await employeeController.editProfessionalInfo(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

route.post('/employees/bank/:id', authenticateFirebaseUser, async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  const parsed = BankDetailsSchema.safeParse(data);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid bank data",
      details: parsed.error.format()
    });
  }

  try {
    const bank = await employeeController.addBankDetails(id, data)
    res.status(201).json(bank);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }

})

route.patch('/employees/bank/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const updated = await employeeController.editBankDetails(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

route.get('/employees/all/:code', authenticateFirebaseUser, async (req, res) => {
  try {
    const data = await employeeController.getCompleteEmployeeDetailsByCode(req.params.code);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
})

route.post('/employees/loan/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const bank = await loanController.createLoanRequest(req.params.id, req.body)
    res.status(201).json(bank);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
})

route.post('/employees/approvedLoan/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const bank = await loanController.approvedLoan(req.params.id, req.body)
    res.status(201).json(bank);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
})

route.post('/employees/cancelLoan/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const { cancelReason } = req.body;
    const bank = await loanController.cancelLoan(req.params.id, cancelReason)
    res.status(201).json(bank);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
})

route.patch('/employees/loan/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const bank = await loanController.editLoan(req.params.id, req.body)
    res.status(201).json(bank);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
})

route.post('/employees/proviousJob/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const bank = await employeeController.addPreviousJob(req.params.id, req.body)
    res.status(201).json(bank);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
})

route.patch('/employees/proviousJob/:id', authenticateFirebaseUser, async (req, res) => {
  try {
    const bank = await employeeController.editPreviousJob(req.params.id, req.body)
    res.status(201).json(bank);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
})

export default route;