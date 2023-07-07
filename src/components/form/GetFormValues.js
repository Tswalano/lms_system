export const GetFormValues = (formEvent) => {
  const form = formEvent.target;
  const formValues = {};

  for (let i = 0; i < form.length; i++) {
    const input = form[i];
    if (input.name) {
      formValues[input.name] = input.value;
    }
  }

  return formValues;
};
