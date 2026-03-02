import React from "react";
import { Link, useParams } from "react-router-dom";
import { blogs as mockBlogs } from "../mockData";
import { Card } from "../components/UI";

export function BlogDetail() {
  const { id } = useParams();
  const blog = mockBlogs.find((b) => b.id === id);
  if (!blog) return <p className="p-4">Bài viết không tồn tại.</p>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">{blog.title}</h1>
        <div className="text-gray-700 mb-4">{blog.content}</div>
        <Link
          to="/blogs"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Quay lại danh sách
        </Link>
      </Card>
    </div>
  );
}
