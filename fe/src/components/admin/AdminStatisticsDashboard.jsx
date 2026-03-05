import React, { useEffect, useState } from "react";
import { statisticsService } from "../../services";
import { Loading, Alert } from "../UI";

export function AdminStatisticsDashboard() {
  const [overview, setOverview] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [doctorStats, setDoctorStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("month"); // 'week', 'month', 'year'

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { range: dateRange };

      // Fetch overview
      const overviewResponse = await statisticsService.getOverview(params);
      setOverview(overviewResponse.data?.data || overviewResponse.data);

      // Fetch monthly/period statistics
      const appointmentsResponse =
        await statisticsService.getAppointments(params);
      setMonthlyStats(
        appointmentsResponse.data?.data || appointmentsResponse.data || [],
      );

      // Fetch doctor statistics
      const doctorsResponse = await statisticsService.getDoctors(params);
      setDoctorStats(doctorsResponse.data?.data || doctorsResponse.data || []);
    } catch (err) {
      console.error("Failed to load statistics:", err);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="admin-statistics-dashboard">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-4">Statistics Dashboard</h2>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          {["week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-md capitalize transition ${
                dateRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Appointments"
            value={overview.totalAppointments || 0}
            color="blue"
            icon="📅"
          />
          <StatCard
            title="Confirmed"
            value={overview.confirmedAppointments || 0}
            color="green"
            icon="✅"
          />
          <StatCard
            title="Completed"
            value={overview.completedAppointments || 0}
            color="purple"
            icon="🏆"
          />
          <StatCard
            title="Revenue"
            value={`₫${(overview.totalRevenue || 0).toLocaleString()}`}
            color="amber"
            icon="💰"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Appointments Trend */}
        <div className="border rounded-lg p-6 bg-white">
          <h3 className="text-xl font-semibold mb-4">Appointments Trend</h3>
          {monthlyStats.length === 0 ? (
            <p className="text-gray-500">No data available</p>
          ) : (
            <div className="space-y-3">
              {monthlyStats.map((stat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">
                      {stat.date || stat.period}
                    </span>
                    <span className="text-gray-600">
                      {stat.count} appointments
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (stat.count /
                            Math.max(...monthlyStats.map((s) => s.count))) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue Breakdown */}
        {overview && (
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-xl font-semibold mb-4">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Basic Appointments</span>
                  <span className="font-medium">
                    ₫{(overview.basicRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        overview.totalRevenue > 0
                          ? ((overview.basicRevenue || 0) /
                              overview.totalRevenue) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Advanced Appointments</span>
                  <span className="font-medium">
                    ₫{(overview.advancedRevenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${
                        overview.totalRevenue > 0
                          ? ((overview.advancedRevenue || 0) /
                              overview.totalRevenue) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Doctors */}
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-xl font-semibold mb-4">
          Top Doctors by Appointments
        </h3>
        {doctorStats.length === 0 ? (
          <p className="text-gray-500">No data available</p>
        ) : (
          <div className="space-y-4">
            {doctorStats.slice(0, 10).map((doctor, idx) => (
              <div
                key={idx}
                className="border-b last:border-b-0 pb-4 last:pb-0"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">
                      {doctor.name || doctor.fullName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {doctor.specializations?.join(", ") || "General"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {doctor.appointmentCount || 0}
                    </div>
                    <div className="text-sm text-yellow-600">
                      ⭐ {(doctor.avgRating || 0).toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (doctor.appointmentCount /
                          Math.max(
                            ...doctorStats.map((d) => d.appointmentCount),
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Distribution */}
      {overview && (
        <div className="border rounded-lg p-6 bg-white mt-6">
          <h3 className="text-xl font-semibold mb-4">
            Appointment Status Distribution
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <StatusItem
              label="Pending Payment"
              count={overview.pendingPaymentCount || 0}
              color="yellow"
            />
            <StatusItem
              label="Waiting Assign"
              count={overview.waitingAssignCount || 0}
              color="blue"
            />
            <StatusItem
              label="Confirmed"
              count={overview.confirmedAppointments || 0}
              color="green"
            />
            <StatusItem
              label="Completed"
              count={overview.completedAppointments || 0}
              color="purple"
            />
            <StatusItem
              label="Canceled"
              count={overview.canceledCount || 0}
              color="red"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ title, value, color, icon }) {
  const colors = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
    amber: "bg-amber-50 border-amber-200",
  };

  return (
    <div className={`border rounded-lg p-4 ${colors[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <h4 className="text-gray-600 text-sm font-medium mb-1">{title}</h4>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatusItem({ label, count, color }) {
  const colors = {
    yellow: "bg-yellow-100 text-yellow-800",
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    purple: "bg-purple-100 text-purple-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <div className={`p-3 rounded-lg text-center ${colors[color]}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}
