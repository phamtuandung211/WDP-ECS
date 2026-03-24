import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { blogService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
import { Pagination } from "../components/Pagination";

const TOPIC_LABELS = {
  all: "Tất cả",
  benhly: "Bệnh lý mắt",
  phongngua: "Phòng ngừa",
  phauthu: "Phẫu thuật",
  treem: "Mắt trẻ em",
  congnghe: "Công nghệ",
};

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "");
}

function stripHtml(value) {
  return (value || "")
    .replaceAll(/<[^>]*>/g, " ")
    .replaceAll(/\s+/g, " ")
    .trim();
}

function detectTopics(blog) {
  const text = normalizeText(
    `${blog?.title || ""} ${stripHtml(blog?.content || "")}`,
  );
  const topics = [];

  if (
    /(duc thuy tinh the|glocom|glaucoma|vong mac|benh|dau hieu|chan doan)/.test(
      text,
    )
  ) {
    topics.push("benhly");
  }
  if (/(phong ngua|thoi quen|bao ve|kho mat|man hinh|20-20-20)/.test(text)) {
    topics.push("phongngua");
  }
  if (/(phau thuat|lasik|smile|laser|phaco)/.test(text)) {
    topics.push("phauthu");
  }
  if (/(tre em|nhi|hoc sinh|can thi som)/.test(text)) {
    topics.push("treem");
  }
  if (/(cong nghe|ai|oct|chan doan hinh anh)/.test(text)) {
    topics.push("congnghe");
  }

  if (!topics.length) topics.push("benhly");
  return [...new Set(topics)];
}

function topicVisual(topic) {
  const map = {
    benhly: {
      icon: "🧪",
      gradient: "linear-gradient(135deg, #C8E0F4, #4A90C4)",
    },
    phongngua: {
      icon: "💻",
      gradient: "linear-gradient(135deg, #D0E8F8, #6AADD4)",
    },
    phauthu: {
      icon: "⚡",
      gradient: "linear-gradient(135deg, #B8D4F0, #2D6FA3)",
    },
    treem: {
      icon: "🧒",
      gradient: "linear-gradient(135deg, #D4EDF8, #85C2E8)",
    },
    congnghe: {
      icon: "🤖",
      gradient: "linear-gradient(135deg, #B8D4F0, #4A90C4)",
    },
  };
  return map[topic] || map.benhly;
}

export function Blogs() {
  const [result, setResult] = useState({ data: [], metadata: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("all");

  const limit = 9;
  const { data: blogs, metadata } = result;

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await blogService.getList({
          page,
          limit,
          search: search || undefined,
        });
        setResult(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Không tải được danh sách blog",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = metadata?.totalPages ?? 1;

  const blogsWithMeta = useMemo(() => {
    return (blogs || []).map((blog, index) => {
      const topics = detectTopics(blog);
      const primaryTopic = topics[0] || "benhly";
      return {
        ...blog,
        _topics: topics,
        _topicText: topics.join(" "),
        _primaryTopic: primaryTopic,
        _visual: topicVisual(primaryTopic),
        _isFeatured: index === 0,
      };
    });
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const kw = normalizeText(searchInput.trim());

    return blogsWithMeta.filter((blog) => {
      const matchTopic =
        activeTopic === "all" || blog._topics.includes(activeTopic);

      if (!matchTopic) return false;
      if (!kw) return true;

      const haystack = normalizeText(
        `${blog.title || ""} ${stripHtml(blog.content || "")}`,
      );

      return haystack.includes(kw);
    });
  }, [activeTopic, blogsWithMeta, searchInput]);

  const featuredBlog = filteredBlogs[0] || null;
  const listBlogs = filteredBlogs.slice(1);

  const topicCounts = useMemo(() => {
    const base = {
      all: blogsWithMeta.length,
      benhly: 0,
      phongngua: 0,
      phauthu: 0,
      treem: 0,
      congnghe: 0,
    };
    blogsWithMeta.forEach((blog) => {
      blog._topics.forEach((topic) => {
        if (topic in base) base[topic] += 1;
      });
    });
    return base;
  }, [blogsWithMeta]);

  const recentBlogs = useMemo(() => {
    return [...blogsWithMeta]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3);
  }, [blogsWithMeta]);

  const allTags = useMemo(() => {
    const tags = new Set();
    blogsWithMeta.forEach((blog) => {
      blog._topics.forEach((topic) => {
        tags.add(topic);
      });
    });
    return Array.from(tags);
  }, [blogsWithMeta]);

  const formatDate = (value) => {
    if (!value) return "Mới cập nhật";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Mới cập nhật";
    return d.toLocaleDateString("vi-VN");
  };

  const readTime = (value) => {
    const words = stripHtml(value).split(" ").filter(Boolean).length;
    return Math.max(2, Math.ceil(words / 180));
  };

  if (loading && !blogs?.length) return <Loading />;

  return (
    <div className="page vblog-page">
      <section className="vblog-hero">
        <div className="vblog-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>Bài viết</span>
        </div>
        <div className="vblog-hero-row">
          <div>
            <h1 className="vblog-title">
              Bài viết <em>sức khỏe</em>
            </h1>
            <p className="vblog-sub">
              Các bài viết chuyên sâu về chăm sóc mắt và sức khỏe, được biên
              soạn bởi đội ngũ nhãn khoa VisionCare.
            </p>
          </div>
          <div className="vblog-search-wrap">
            <input
              type="text"
              className="vblog-search-input"
              placeholder="Tìm kiếm bài viết..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <span className="vblog-search-icon" aria-hidden="true">
              🔍
            </span>
          </div>
        </div>
      </section>

      <section className="vblog-filter-bar">
        <span className="vblog-filter-label">Chủ đề:</span>
        {Object.entries(TOPIC_LABELS).map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={`vblog-chip ${activeTopic === key ? "active" : ""}`}
            onClick={() => setActiveTopic(key)}
          >
            {label}
          </button>
        ))}
        <span className="vblog-filter-count">
          {filteredBlogs.length} bài viết
        </span>
      </section>

      {error && <Alert type="error">{error}</Alert>}

      <section className="vblog-main-wrap">
        <div className="vblog-articles-area">
          {featuredBlog ? (
            <Link
              to={`/blogs/${featuredBlog._id}`}
              className="vblog-featured"
              data-cat={featuredBlog._topicText}
              data-title={normalizeText(featuredBlog.title)}
            >
              <div
                className="vblog-featured-img"
                style={{ background: featuredBlog._visual.gradient }}
              >
                {featuredBlog.image ? (
                  <img
                    src={getUploadFullUrl(featuredBlog.image)}
                    alt={featuredBlog.title}
                  />
                ) : (
                  <span>{featuredBlog._visual.icon}</span>
                )}
              </div>
              <div className="vblog-featured-body">
                <span className="vblog-art-cat">
                  {TOPIC_LABELS[featuredBlog._primaryTopic] || "Bài viết"}
                </span>
                <h2 className="vblog-featured-title">{featuredBlog.title}</h2>
                <p className="vblog-excerpt">
                  {stripHtml(featuredBlog.content).slice(0, 220) ||
                    "Nội dung đang được cập nhật."}
                </p>
                <div className="vblog-meta-row">
                  <span>{formatDate(featuredBlog.createdAt)}</span>
                  <span>•</span>
                  <span>{readTime(featuredBlog.content)} phút đọc</span>
                </div>
                <span className="vblog-btn-read">Xem chi tiết →</span>
              </div>
            </Link>
          ) : null}

          <div className="vblog-list" id="art-list">
            {listBlogs.length ? (
              listBlogs.map((blog) => (
                <Link
                  key={blog._id}
                  to={`/blogs/${blog._id}`}
                  className="vblog-row"
                  data-cat={blog._topicText}
                  data-title={normalizeText(blog.title)}
                >
                  <div
                    className="vblog-row-img"
                    style={{ background: blog._visual.gradient }}
                  >
                    {blog.image ? (
                      <img
                        src={getUploadFullUrl(blog.image)}
                        alt={blog.title}
                      />
                    ) : (
                      <span>{blog._visual.icon}</span>
                    )}
                  </div>
                  <div className="vblog-row-body">
                    <div>
                      <span className="vblog-art-cat vblog-art-cat-inline">
                        {TOPIC_LABELS[blog._primaryTopic] || "Bài viết"}
                      </span>
                      <h3 className="vblog-row-title">{blog.title}</h3>
                      <p className="vblog-row-excerpt">
                        {stripHtml(blog.content).slice(0, 170) ||
                          "Nội dung đang được cập nhật."}
                      </p>
                    </div>
                    <div className="vblog-row-footer">
                      <div className="vblog-meta-mini">
                        <span>{formatDate(blog.createdAt)}</span>
                        <span>•</span>
                        <span>{readTime(blog.content)} phút đọc</span>
                      </div>
                      <span className="vblog-btn-read-ghost">
                        Xem chi tiết →
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="vblog-empty">
                Không tìm thấy bài viết phù hợp.
              </div>
            )}

            {/*
              TEMPLATE: Thêm bài viết mới
              - Thêm thẻ Link className="vblog-row"
              - Gán data-cat="benhly phongngua phauthu treem congnghe"
              - data-title chứa keywords lowercase để tìm kiếm nhanh
            */}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={metadata?.total}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </div>

        <aside className="vblog-sidebar">
          <div className="vblog-widget">
            <h4 className="vblog-widget-title">Chủ đề</h4>
            <div className="vblog-tag-cloud">
              {allTags.length ? (
                allTags.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    className={`vblog-tag ${activeTopic === topic ? "active" : ""}`}
                    onClick={() => setActiveTopic(topic)}
                  >
                    {TOPIC_LABELS[topic] || topic}
                    <span>{topicCounts[topic] || 0}</span>
                  </button>
                ))
              ) : (
                <span className="vblog-tag">Chưa có chủ đề</span>
              )}
            </div>
          </div>

          <div className="vblog-widget">
            <h4 className="vblog-widget-title">Bài viết mới</h4>
            <div className="vblog-recent-list">
              {recentBlogs.length ? (
                recentBlogs.map((blog) => (
                  <Link
                    key={blog._id}
                    to={`/blogs/${blog._id}`}
                    className="vblog-recent-item"
                  >
                    <div
                      className="vblog-recent-thumb"
                      style={{ background: blog._visual.gradient }}
                    >
                      {blog.image ? (
                        <img
                          src={getUploadFullUrl(blog.image)}
                          alt={blog.title}
                        />
                      ) : (
                        <span>{blog._visual.icon}</span>
                      )}
                    </div>
                    <div className="vblog-recent-info">
                      <p className="vblog-recent-title">{blog.title}</p>
                      <span className="vblog-recent-date">
                        {formatDate(blog.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="vblog-recent-empty">Chưa có bài viết mới.</p>
              )}
            </div>
          </div>

          <div className="vblog-cta-widget">
            <h4>Cần tư vấn từ bác sĩ?</h4>
            <p>Đặt lịch khám trực tuyến nhanh chóng, không cần chờ đợi.</p>
            <Link to="/appointments" className="vblog-btn-cta-widget">
              Đặt lịch ngay
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
