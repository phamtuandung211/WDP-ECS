import Blog from "../models/Blog.js";

export const getBlogList = async ({ page = 1, limit = 10, search }) => {
  const skip = (Math.max(1, page) - 1) * Math.max(1, Math.min(limit, 100));
  const safeLimit = Math.max(1, Math.min(limit, 100));

  const query = {};
  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { content: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Blog.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Blog.countDocuments(query),
  ]);

  return {
    data: items,
    metadata: {
      total,
      page: Math.max(1, page),
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

export const getBlogById = async (id) => {
  const blog = await Blog.findById(id).lean();
  if (!blog) {
    const err = new Error("Blog not found");
    err.status = 404;
    throw err;
  }
  return blog;
};

export const createBlog = async (payload, createdByStaffId) => {
  const { title, content, image } = payload;

  if (!title || !title.trim()) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.data = { title: "Title is required" };
    throw err;
  }
  if (!content || !content.trim()) {
    const err = new Error("Validation failed");
    err.status = 400;
    err.data = { content: "Content is required" };
    throw err;
  }

  const blog = new Blog({
    title: title.trim(),
    content: content.trim(),
    image: image || undefined,
    createdBy: createdByStaffId,
  });
  await blog.save();
  return blog.toObject();
};

export const updateBlog = async (id, payload) => {
  const blog = await Blog.findById(id);
  if (!blog) {
    const err = new Error("Blog not found");
    err.status = 404;
    throw err;
  }

  const { title, content, image } = payload;
  if (title !== undefined) blog.title = title.trim();
  if (content !== undefined) blog.content = content.trim();
  if (image !== undefined) blog.image = image || null;

  await blog.save();
  return blog.toObject();
};

export const deleteBlog = async (id) => {
  const blog = await Blog.findByIdAndDelete(id);
  if (!blog) {
    const err = new Error("Blog not found");
    err.status = 404;
    throw err;
  }
  return { message: "Blog deleted successfully" };
};
