import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type Props = {
    // color: string,
    // icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    icon: any,
    sx: any,
    title: string,
    total: number,
}

export default function AppWidgetSummary({ title, total, icon, sx, ...other }: Props) {
    return (
        <Card
            component={Stack}
            spacing={3}
            direction="row"
            sx={{
                // bgcolor: '#D8FAE5',
                px: 3,
                py: 5,
                borderRadius: 2,
                ...sx,
            }}
            {...other}
        >
            {icon && <Box sx={{ width: 64, height: 64 }}>{icon}</Box>}

            <Stack spacing={0.5}>
                <Typography variant="h4">{total}</Typography>

                <Typography variant="subtitle2" sx={{ color: 'text.disabled' }}>
                    {title}
                </Typography>
            </Stack>
        </Card>
    )
}