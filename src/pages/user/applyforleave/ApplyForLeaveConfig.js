const ApplyForLeaveForm = {
  formFields: [
    {
      label: "Leave Type",
      name: "leaveType",
      type: "select",
      options: [
        { value: "Sick Leave", labelText: "Sick Leave" },
        { value: "Annual Leave", labelText: "Annual Leave" },
        { value: "Maternity Leave", labelText: "Maternity Leave" },
        { value: "Bereavement", labelText: "Bereavement" },
        { value: "Family Responsibility", labelText: "Family Responsibility" },
        { value: "Paternity Leave", labelText: "Paternity Leave" },
      ],
    },
    {
      label: "Leave Length",
      name: "leaveLength",
      type: "select",
      options: [
        { value: "Half Day", labelText: "Half Day" },
        { value: "Full Day", labelText: "Full Day" },
      ],
    },
    { label: "Start Date", name: "startDate", type: "date" },
    { label: "End Date", name: "endDate", type: "date" },

    { label: "Leave Comment", name: "leaveComment", type: "text" },
    { label: "", name: "leaveAttachement", type: "file" },
  ],
};

export default ApplyForLeaveForm;
