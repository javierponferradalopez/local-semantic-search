const BYTES_IN_A_MEGABYTE = 1024 * 1024;
const TENTHS = 10;

const MEGABYTES = new Intl.NumberFormat('en-GB', {maximumFractionDigits: 1});

// Rounded up, so a size just above the limit never reads as the limit.
export const textOfSize = (sizeInBytes: number): string =>
  `${MEGABYTES.format(Math.ceil((sizeInBytes / BYTES_IN_A_MEGABYTE) * TENTHS) / TENTHS)} MB`;
