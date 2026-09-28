type Citation = {fileUrl: string; page?: number};

// The fragment is presentation, so the browser adds it to the URL as it is (ADR-0012).
export const hrefOf = ({fileUrl, page}: Citation): string =>
  page === undefined ? fileUrl : `${fileUrl}#page=${page}`;
