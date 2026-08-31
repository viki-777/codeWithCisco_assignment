import type { Employee } from '../org/types'

/**
 * Contains three distinct kinds of INVALID_EMPLOYEE field problems: a
 * lowercase employee_id that fails the ID pattern, a blank name, and a
 * salary of 0. Records are ordered so the ID-shape problem (record 2) is
 * the first one validate() reaches and reports — the blank name and zero
 * salary further down illustrate the other two cases but are never reached
 * because validation stops at the first failure, per spec.
 */
export const badFieldDept: Employee[] = [
  { employee_id: 'HOD', name: 'Priya Nair', role: 'Department head', monthly_salary: 150000, manager_id: null },
  { employee_id: 'bad-id', name: 'Rahul Sen', role: 'Programme manager', monthly_salary: 90000, manager_id: 'HOD' },
  { employee_id: 'E_1', name: '   ', role: 'Developer', monthly_salary: 42000, manager_id: 'HOD' },
  { employee_id: 'E_2', name: 'Anita Rao', role: 'Data analyst', monthly_salary: 0, manager_id: 'HOD' },
]
