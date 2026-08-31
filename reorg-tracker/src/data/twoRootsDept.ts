import type { Employee } from '../org/types'

/** Otherwise-valid department with two employees whose manager_id is null. */
export const twoRootsDept: Employee[] = [
  { employee_id: 'HOD', name: 'Priya Nair', role: 'Department head', monthly_salary: 150000, manager_id: null },
  { employee_id: 'HOD2', name: 'Rahul Sen', role: 'Department head', monthly_salary: 140000, manager_id: null },
  { employee_id: 'MGR_A', name: 'Devika Iyer', role: 'Programme manager', monthly_salary: 90000, manager_id: 'HOD' },
]
