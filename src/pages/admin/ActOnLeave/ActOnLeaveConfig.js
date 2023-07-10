import ActOnLeave from "./ActOnLeave";
//Form Config created for Approve/Reject Dropdown box and for Feedback Field
const ActOnLeaveConfig = {
  formFields: [
    {
      label: "Approve/Reject",
      name: "approval",
      type: "select",
      options: [
        { value: "Approve", labelText: "Approve" },
        { value: "Reject", labelText: "Reject" },
      ],
    },
    {
      label: "Add Reason for feedback... (Optional)",
      name: "feedback",
      type: "text",
    },
  ],
};

export default ActOnLeaveConfig;
