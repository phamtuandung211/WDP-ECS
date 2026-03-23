import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { blogService, getUploadFullUrl } from "../services";
import { Loading, Alert } from "../components/UI";
import { Pagination } from "../components/Pagination";

const TOPIC_LABELS = {
  all: "Tat ca",
  benhly: "Benh ly mat",
  phongngua: "Phong ngua",
  phauthu: "Phau thuat",
  treem: "Mat tre em",
  congnghe: "Cong nghe",
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
    if (!value) return "Moi cap nhat";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Moi cap nhat";
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
          <Link to="/">Trang chu</Link>
          <span>/</span>
          <span>Bai viet</span>
        </div>
        <div className="vblog-hero-row">
          <div>
            <h1 className="vblog-title">
              Bai viet <em>suc khoe</em>
            </h1>
            <p className="vblog-sub">
              Cac bai viet chuyen sau ve cham soc mat va suc khoe, duoc bien
              soan boi doi ngu nhan khoa VisionCare.
            </p>
          </div>
          <div className="vblog-search-wrap">
            <input
              type="text"
              className="vblog-search-input"
              placeholder="Tim kiem bai viet..."
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
        <span className="vblog-filter-label">Chu de:</span>
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
          {filteredBlogs.length} bai viet
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
                  {TOPIC_LABELS[featuredBlog._primaryTopic] || "Bai viet"}
                </span>
                <h2 className="vblog-featured-title">{featuredBlog.title}</h2>
                <p className="vblog-excerpt">
                  {stripHtml(featuredBlog.content).slice(0, 220) ||
                    "Noi dung dang duoc cap nhat."}
                </p>
                <div className="vblog-meta-row">
                  <span>{formatDate(featuredBlog.createdAt)}</span>
                  <span>•</span>
                  <span>{readTime(featuredBlog.content)} phut doc</span>
                </div>
                <span className="vblog-btn-read">Xem chi tiet →</span>
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
                        {TOPIC_LABELS[blog._primaryTopic] || "Bai viet"}
                      </span>
                      <h3 className="vblog-row-title">{blog.title}</h3>
                      <p className="vblog-row-excerpt">
                        {stripHtml(blog.content).slice(0, 170) ||
                          "Noi dung dang duoc cap nhat."}
                      </p>
                    </div>
                    <div className="vblog-row-footer">
                      <div className="vblog-meta-mini">
                        <span>{formatDate(blog.createdAt)}</span>
                        <span>•</span>
                        <span>{readTime(blog.content)} phut doc</span>
                      </div>
                      <span className="vblog-btn-read-ghost">
                        Xem chi tiet →
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="vblog-empty">
                Khong tim thay bai viet phu hop.
              </div>
            )}

            {/*
              TEMPLATE: Them bai viet moi
              - Them the Link className="vblog-row"
              - Gan data-cat="benhly phongngua phauthu treem congnghe"
              - data-title chua keywords lowercase de tim kiem nhanh
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
            <h4 className="vblog-widget-title">Chu de</h4>
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
                <span className="vblog-tag">Chua co chu de</span>
              )}
            </div>
          </div>

          <div className="vblog-widget">
            <h4 className="vblog-widget-title">Bai viet moi</h4>
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
                <p className="vblog-recent-empty">Chua co bai viet moi.</p>
              )}
            </div>
          </div>

          <div className="vblog-cta-widget">
            <h4>Can tu van tu bac si?</h4>
            <p>Dat lich kham truc tuyen nhanh chong, khong can cho doi.</p>
            <Link to="/appointments" className="vblog-btn-cta-widget">
              Dat lich ngay
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
