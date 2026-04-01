export type GeoPoint = { latitude: number; longitude: number };

function parseEWKBPoint(hex: string): GeoPoint {
    const buf = Buffer.from(hex, "hex");
    const isLE = buf[0] === 1;
    const readUInt32 = (o: number) => (isLE ? buf.readUInt32LE(o) : buf.readUInt32BE(o));
    const readDouble = (o: number) => (isLE ? buf.readDoubleLE(o) : buf.readDoubleBE(o));
    const type = readUInt32(1);
    const hasSRID = !!(type & 0x20000000);
    const offset = 5 + (hasSRID ? 4 : 0);
    return { longitude: readDouble(offset), latitude: readDouble(offset + 8) };
}

export const pointTransformer = {
    to: (value: GeoPoint | null): string | null =>
        value ? `POINT(${value.longitude} ${value.latitude})` : null,
    from: (value: string | { type: string; coordinates: number[] } | null): GeoPoint | null => {
        if (!value) return null;
        if (typeof value === "object") {
            return { longitude: value.coordinates[0], latitude: value.coordinates[1] };
        }
        return parseEWKBPoint(value);
    }
};
