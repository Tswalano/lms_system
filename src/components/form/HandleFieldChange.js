export const handleFieldChange = (setFormValues) => (fieldName, value) => {
  setFormValues((prevValues) => ({
    ...prevValues,
    [fieldName]: value,
  }));
};
