const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// Hàm xây dựng tham số phân trang an toàn
export const buildPagination = ({
  page = 1,
  limit = DEFAULT_LIMIT,
  maxLimit = MAX_LIMIT,
}) => {
  const safeLimit = Math.min(Number(limit) || DEFAULT_LIMIT, maxLimit);
  const safePage = Number(page) > 0 ? Number(page) : 1;

  const offset = (safePage - 1) * safeLimit;

  return {
    limit: safeLimit,
    offset,
    page: safePage,
  };
};

// Hàm lấy metadata phân trang
export const getPaginationMetadata = (
  itemsCount,
  totalItems,
  limit = DEFAULT_LIMIT,
  offset = 0,
) => {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

  const currentPage = Math.floor(offset / limit) + 1;

  return {
    currentPage,
    itemsCount,
    itemsPerPage: Number(limit),
    totalItems,
    totalPages,
  };
};
