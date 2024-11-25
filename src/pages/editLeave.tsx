import { Box, Container, Stack, Typography } from "@mui/material";
import { object, string, TypeOf } from "zod";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import FormInput from "../components/ui/FormInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingButton } from "@mui/lab";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { updateLeaveFN, getPublicHolidayDatesFn } from "../api/authAPI";
import { useCookies } from "react-cookie";
import dayjs from "dayjs";
import dayjsutc from "dayjs/plugin/utc";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

dayjs.extend(dayjsutc);

const updateLeaveSchema = object({
  leave_type: string().min(1, "Leave type is required"),
  leave_start: string().min(1, "Start date is required"),
  leave_length: string().min(1, "Leave length is required"),
  leave_comment: string().min(1, "Comments are required").default(""),
  leave_end: string().min(1, "End date is required"),
}).refine(
  (data) => {
    const startDate = new Date(data.leave_start);
    const endDate = new Date(data.leave_end);

    // if leave_length is "half", end date must be the same as start date
    if (data.leave_length === "Half Day" && endDate > startDate) {
      return false;
    }

    // end date should not be before start date
    if (endDate < startDate) {
      return false;
    }

    return true;
  },
  {
    path: ["leave_end"],
    message: "End date must be the same as or after the start date",
  }
);

export type updateLeaveInput = TypeOf<typeof updateLeaveSchema>;

const leaveTypes = [
  { id: 1, value: "Sick Leave", label: "Sick Leave" },
  { id: 2, value: "Annual Leave", label: "Annual Leave" },
  { id: 3, value: "Maternity Leave", label: "Maternity Leave" },
  { id: 4, value: "Paternity Leave", label: "Paternity Leave" },
  { id: 5, value: "Family Responsibility", label: "Family Responsibility" },
];

function UpdateLeave() {
  const [cookies] = useCookies(["token"]);
  const navigate = useNavigate();
  const [leaveLength, setLeaveLength] = useState<string>("full");
  const methods = useForm<updateLeaveInput>({
    resolver: zodResolver(updateLeaveSchema),
  });
  const {
    mutate: updateLeave,
    isPending,
    error,
    isError,
  } = useMutation({
    mutationKey: ["updateLeave"],
    mutationFn: (leaveData: updateLeaveInput) =>
      updateLeaveFN(cookies.token, leaveData),
    onSuccess: () => {
      toast.success("Leave request updated successfully!");
      navigate("/"); // Redirect to dashboard
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update leave request"
      );
    },
  });
  const callGetPublicHolidays = useQuery({
    queryKey: ["publicHolidays"],
    queryFn: async ({ queryKey }) => getPublicHolidayDatesFn(cookies.token),
    select: (publicHolidays) => publicHolidays.map((phd) => dayjs.utc(phd)),
  });
  const {
    reset,
    handleSubmit,
    formState: { isSubmitSuccessful },
    setValue,
    watch,
  } = methods;

  const leaveLengthWatch = watch("leave_length");
  const leaveStartWatch = watch("leave_start");
  const allFields = watch();

  const isFormValid =
    allFields.leave_type &&
    allFields.leave_start &&
    allFields.leave_length &&
    allFields.leave_comment &&
    (leaveLengthWatch === "Half Day" || allFields.leave_end);

  useEffect(() => {
    if (leaveLengthWatch === "Half Day") {
      setValue("leave_end", leaveStartWatch);
    }
  }, [leaveLengthWatch, leaveStartWatch, setValue]);

  const onSubmitHandler: SubmitHandler<updateLeaveInput> = (values) => {
    updateLeave(values);
  };

  const shouldDisableDate = (date: dayjs.Dayjs) => {
    const dayOfWeek = date.day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayIsPublicHoliday = callGetPublicHolidays.isSuccess
      ? callGetPublicHolidays.data?.some((d) => d.isSame(date))
      : false;
    return isWeekend || dayIsPublicHoliday;
  };

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  return (
    <Container maxWidth="xl">
      <Stack>
        <Typography variant="h4">Edit Leave</Typography>
      </Stack>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            maxWidth: "650px",
            width: "100%",
            p: 2,
            borderRadius: 2,
            alignItems: "flex-start",
            justifyContent: "flex-start",
          }}
        >
          <Box sx={{ marginTop: 2 }}>
            <FormProvider {...methods}>
              <Box
                component="form"
                onSubmit={handleSubmit(onSubmitHandler)}
                noValidate
                autoComplete="off"
              >
                <FormInput
                  type="select"
                  name="leave_type"
                  label="Leave Type"
                  options={leaveTypes.map((leave) => ({
                    value: leave.value,
                    label: leave.label,
                  }))}
                />
                <FormInput
                  name="leave_length"
                  label="Leave Length"
                  type="select"
                  options={[
                    { value: "Half Day", label: "Half Day" },
                    { value: "Full Day", label: "Full Day" },
                  ]}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setLeaveLength(newValue);
                    setValue("leave_length", newValue);
                    if (newValue === "Half Day") {
                      setValue("leave_end", "");
                    }
                  }}
                />
                <FormInput
                  name="leave_start"
                  label="Start Date"
                  type="date"
                  disableDatesHandler={shouldDisableDate}
                />
                <FormInput
                  name="leave_end"
                  label="End Date"
                  type="date"
                  disableDatesHandler={shouldDisableDate}
                  disabled={leaveLengthWatch === "Half Day"}
                />
                <FormInput
                  name="leave_comment"
                  label="Comments"
                  type="textarea"
                />
                <LoadingButton
                  variant="contained"
                  sx={{ mt: 2, borderRadius: "10px" }}
                  fullWidth
                  disableElevation
                  type="submit"
                  loading={isPending}
                  disabled={isPending || !isFormValid}
                >
                  Update Leave
                </LoadingButton>
              </Box>
            </FormProvider>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}

export default UpdateLeave;
