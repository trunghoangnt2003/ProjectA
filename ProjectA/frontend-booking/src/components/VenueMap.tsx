import { Box, Button, Group } from "@mantine/core";
import { IconMapPin, IconDirections } from "@tabler/icons-react";

interface VenueMapProps {
  /** Địa chỉ hoặc "lat,lng". */
  query: string;
  height?: number;
}

/**
 * Bản đồ Google Maps nhúng (không cần API key) + nút chỉ đường.
 */
export function VenueMap({ query, height = 320 }: VenueMapProps) {
  const q = encodeURIComponent(query);
  const embedSrc = `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  const viewUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;

  return (
    <Box>
      <Box
        style={{
          overflow: "hidden",
          borderRadius: "var(--mantine-radius-md)",
          border: "1px solid var(--mantine-color-gray-3)",
        }}
      >
        <iframe
          title="Bản đồ tới sân"
          src={embedSrc}
          width="100%"
          height={height}
          style={{ border: 0, display: "block" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </Box>
      <Group mt="sm" gap="sm">
        <Button
          component="a"
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          leftSection={<IconDirections size={18} />}
        >
          Chỉ đường
        </Button>
        <Button
          component="a"
          href={viewUrl}
          target="_blank"
          rel="noreferrer"
          variant="light"
          leftSection={<IconMapPin size={18} />}
        >
          Xem trên Google Maps
        </Button>
      </Group>
    </Box>
  );
}
