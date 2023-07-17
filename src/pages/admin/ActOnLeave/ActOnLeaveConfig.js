import ActOnLeave from "./ActOnLeave";
//Form Config created for Approve/Reject Dropdown box and for Feedback Field
const ActOnLeaveConfig = {
  formFields: [
    {
      label: "Approve / Reject",
      name: "approval",
      type: "select",
      options: [
        { value: "approved", labelText: "Approve" },
        { value: "Reject", labelText: "Reject" },
      ],
    },
    {
      label: "Feedback Comment (Optional)",
      name: "feedback",
      type: "text",
    },
  ],
};

export default ActOnLeaveConfig;
