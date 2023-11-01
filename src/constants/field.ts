export const defaultParamsField = [
  { name: 'fields', description: 'Select fields to display, separate by comma', required: false, type: String },
  { name: 'sort', description: 'Field to sort the result', required: false, type: String },
  { name: 'currentPage', description: 'Field to page the result', required: false, type: Number },
  { name: 'pageSize', description: 'Field to limit the result', required: false, type: Number },
  { name: 'startDate', description: 'Start date to limit the result', required: false, type: Number },
  { name: 'endDate', description: 'End date to limit the result', required: false, type: Number },
]