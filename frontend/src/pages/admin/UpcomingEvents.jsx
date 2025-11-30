import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import API from "../../api/axiosConfig";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { HiPlus, HiTrash, HiCalendar, HiPencil } from "react-icons/hi";

const UpcomingEvents = () => {
  const { isOpen } = useSidebar();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(null); // event being edited

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const fetchEvents = async () => {
    try {
      const res = await API.get("/admin/events", { params: { onlyFuture: false } });
      setEvents(res.data?.data || []);
    } catch (e) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await API.put(`/admin/events/${editing.id}`, null, {
          params: {
            title: data.title?.trim(),
            description: data.description || "",
            eventAtIso: data.datetime || undefined
          }
        });
        toast.success("Event updated successfully");
      } else {
        await API.post("/admin/events", null, {
          params: { title: data.title.trim(), description: data.description || "", eventAtIso: data.datetime || undefined },
        });
        toast.success("Event created successfully");
      }
      reset();
      setEditing(null);
      fetchEvents();
    } catch (e) {
      toast.error("Failed to save event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await API.delete(`/admin/events/${id}`);
      fetchEvents();
    } catch (e) {}
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">Upcoming Events</h2>
                <p className="text-gray-600 text-lg">Create and manage upcoming events</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Section - Left Side */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{editing ? "Edit Event" : "Create New Event"}</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        {...register("title", {
                          required: "Title is required",
                          minLength: {
                            value: 2,
                            message: "Title must be at least 2 characters"
                          }
                        })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.title ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        {...register("datetime")}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.datetime ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.datetime && (
                        <p className="mt-1 text-sm text-red-600">{errors.datetime.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        {...register("description")}
                        rows={3}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.description ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                  {editing && (
                    <button type="button" onClick={() => { reset(); setEditing(null); }} className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold">
                      Cancel
                    </button>
                  )}
                  <button type="submit" disabled={submitting} className="flex-1 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md justify-center">
                     {submitting ? (editing ? "Saving..." : "Creating...") : (editing ? "Save Changes" : "Create Event")}
                  </button>
                  </div>
                </form>
              </div>

              {/* All Events Section - Right Side */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">All Events</h3>
                <div className="flex-1 overflow-y-auto max-h-[600px] pr-2">
                  {loading ? (
                    <p className="text-gray-600">Loading...</p>
                  ) : events.length === 0 ? (
                    <p className="text-gray-600">No events found.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {events.map(ev => {
                        const past = ev.eventAt && new Date(ev.eventAt) < new Date();
                        return (
                        <li key={ev.id} className="py-4 flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <HiCalendar className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold text-gray-800 ${past ? "line-through opacity-60" : ""}`}>{ev.title}</div>
                              {ev.description && <div className={`text-sm text-gray-600 mt-1 ${past ? "line-through opacity-60" : ""}`}>{ev.description}</div>}
                              {ev.eventAt && <div className={`text-xs text-gray-500 mt-1 ${past ? "line-through opacity-60" : ""}`}>{new Date(ev.eventAt).toLocaleString()}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => { setEditing(ev); reset({ title: ev.title, description: ev.description || "", datetime: ev.eventAt ? new Date(ev.eventAt).toISOString().slice(0,16) : "" }); }} className="text-blue-600 hover:text-blue-700 transition-colors p-2">
                              <HiPencil className="text-xl" />
                            </button>
                            <button onClick={() => handleDelete(ev.id)} className="text-red-600 hover:text-red-700 transition-colors p-2">
                              <HiTrash className="text-xl" />
                            </button>
                          </div>
                        </li>
                        )})}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingEvents;


