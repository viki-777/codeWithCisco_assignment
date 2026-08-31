import type { Employee } from '../org/types'

/**
 * The 12-employee demo department. Source order as documented in
 * docs/expected-results.md — do not reorder without updating that doc and
 * tests/expected.ts.
 */
export const mainDepartment: Employee[] = [
  { employee_id: 'HOD', name: 'Priya Nair', role: 'Department head', monthly_salary: 150000, manager_id: null },
  { employee_id: 'MGR_A', name: 'Rahul Sen', role: 'Programme manager', monthly_salary: 90000, manager_id: 'HOD' },
  { employee_id: 'MGR_B', name: 'Devika Iyer', role: 'Laboratory manager', monthly_salary: 85000, manager_id: 'HOD' },
  { employee_id: 'LEAD_A', name: 'Karan Bose', role: 'Project lead', monthly_salary: 65000, manager_id: 'MGR_A' },
  { employee_id: 'LEAD_B', name: 'Nikhil Varma', role: 'Research lead', monthly_salary: 62000, manager_id: 'MGR_B' },
  { employee_id: 'E_1', name: 'Meera Joshi', role: 'Senior developer', monthly_salary: 45000, manager_id: 'LEAD_A' },
  { employee_id: 'E_2', name: 'Arjun Menon', role: 'Developer', monthly_salary: 42000, manager_id: 'LEAD_A' },
  { employee_id: 'E_3', name: 'Anita Rao', role: 'Data analyst', monthly_salary: 40000, manager_id: 'MGR_A' },
  { employee_id: 'E_4', name: 'Vikram Das', role: 'Lab technician', monthly_salary: 38000, manager_id: 'LEAD_B' },
  { employee_id: 'E_5', name: 'Farah Khan', role: 'Lab technician', monthly_salary: 36000, manager_id: 'LEAD_B' },
  { employee_id: 'E_6', name: 'Sana Qureshi', role: 'Coordinator', monthly_salary: 34000, manager_id: 'MGR_B' },
  { employee_id: 'E_7', name: 'Tanvi Shah', role: 'Research intern', monthly_salary: 20000, manager_id: 'E_1' },
]
