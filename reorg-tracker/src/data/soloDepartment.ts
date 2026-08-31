import type { Employee } from '../org/types'

/** Required headcount-1 case: a single root employee, no reports. */
export const soloDepartment: Employee[] = [
  { employee_id: 'HOD', name: 'Priya Nair', role: 'Department head', monthly_salary: 150000, manager_id: null },
]
