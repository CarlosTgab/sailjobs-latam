import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import RoleRedirect from "./components/RoleRedirect";

import AuthSync from "./components/AuthSync";
import EventsSync from "./components/EventsSync";
import JobsSync from "./components/JobsSync";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageBackground from "./components/PageBackground";

import {
  RequireAuth,
  RequireRole,
  RequireClubAccess
} from "./components/RouteGuards";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";

import Calendar from "./pages/Calendar";
import EventDetail from "./pages/EventDetail";
import EditEvent from "./pages/EditEvent";

import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import EditJob from "./pages/EditJob";
import Professionals from "./pages/Professionals";
import ProfessionalDetail from "./pages/ProfessionalDetail";

import Classifieds from "./pages/Classifieds";
import CreateClassified from "./pages/CreateClassified";
import ClassifiedDetail from "./pages/ClassifiedDetail";
import EditClassified from "./pages/EditClassified";

import Clubs from "./pages/Clubs";
import ClubDetail from "./pages/ClubDetail";
import ClubDashboard from "./pages/ClubDashboard";
import CreateJob from "./pages/CreateJob";
import CreateEvent from "./pages/CreateEvent";
import Applications from "./pages/Applications";

import OrganizationAdminDashboard from "./pages/OrganizationAdminDashboard";

import AdminDashboard from "./pages/AdminDashboard";
import AdminEvents from "./pages/AdminEvents";
import AdminFayImport from "./pages/AdminFayImport";
import AdminJobs from "./pages/AdminJobs";
import AdminClassifieds from "./pages/AdminClassifieds";
import AdminMessages from "./pages/AdminMessages";
import AdminRanking from "./pages/AdminRanking";
import AdminRankingProfiles from "./pages/AdminRankingProfiles";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";

import Ranking from "./pages/Ranking";

import ApplicantDetail from "./pages/ApplicantDetail";
import NotFound from "./pages/NotFound";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthSync />
      <EventsSync />
      <JobsSync />
      <ScrollToTop />

      <PageBackground />
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <RoleRedirect />
            </RequireAuth>
          }
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <Notifications />
            </RequireAuth>
          }
        />

        <Route
          path="/calendar"
          element={<Calendar />}
        />

        <Route
          path="/calendar/:id"
          element={<EventDetail />}
        />

        <Route
          path="/calendar/:id/edit"
          element={
            <RequireAuth>
              <EditEvent />
            </RequireAuth>
          }
        />

        <Route
          path="/jobs"
          element={<Jobs />}
        />

        <Route
          path="/jobs/:id"
          element={<JobDetail />}
        />

        <Route
          path="/jobs/:id/edit"
          element={
            <RequireAuth>
              <EditJob />
            </RequireAuth>
          }
        />

        <Route
          path="/professionals"
          element={<Professionals />}
        />

        <Route
          path="/professionals/:id"
          element={<ProfessionalDetail />}
        />

        <Route
          path="/classifieds"
          element={<Classifieds />}
        />

        <Route
          path="/classifieds/new"
          element={
            <RequireAuth>
              <CreateClassified />
            </RequireAuth>
          }
        />

        <Route
          path="/classifieds/:id"
          element={<ClassifiedDetail />}
        />

        <Route
          path="/classifieds/:id/edit"
          element={
            <RequireAuth>
              <EditClassified />
            </RequireAuth>
          }
        />

        <Route
          path="/clubs"
          element={<Clubs />}
        />

        <Route
          path="/clubs/:id"
          element={<ClubDetail />}
        />

        <Route
          path="/club-dashboard/:clubId"
          element={
            <RequireClubAccess>
              <ClubDashboard />
            </RequireClubAccess>
          }
        />

        <Route
          path="/club-dashboard/:clubId/new-job"
          element={
            <RequireClubAccess>
              <CreateJob />
            </RequireClubAccess>
          }
        />

        <Route
          path="/club-dashboard/:clubId/new-event"
          element={<Navigate to="/calendar" replace />}
        />

        <Route
          path="/applications/:clubId"
          element={
            <RequireClubAccess>
              <Applications />
            </RequireClubAccess>
          }
        />

        <Route
          path="/user-dashboard"
          element={<Navigate to="/profile" replace />}
        />

        <Route
          path="/coach-dashboard"
          element={<Navigate to="/profile" replace />}
        />

        <Route
          path="/organization-admin"
          element={
            <RequireRole roles="organization_admin">
              <OrganizationAdminDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/organization-admin/new-event"
          element={<Navigate to="/calendar" replace />}
        />

        <Route
          path="/superadmin"
          element={
            <RequireRole roles={["superadmin", "admin"]}>
              <AdminDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/admin"
          element={<Navigate to="/superadmin" replace />}
        />

        <Route
          path="/admin/events"
          element={
            <RequireRole roles={["superadmin", "admin"]}>
              <AdminEvents />
            </RequireRole>
          }
        />

        <Route
          path="/admin/events/new"
          element={
            <RequireRole roles={["superadmin", "admin"]}>
              <CreateEvent />
            </RequireRole>
          }
        />

        <Route
          path="/admin/import-fay"
          element={
            <RequireRole roles={["superadmin", "admin"]}>
              <AdminFayImport />
            </RequireRole>
          }
        />

        <Route
          path="/admin/jobs"
          element={
            <RequireRole roles={["superadmin", "admin"]}>
              <AdminJobs />
            </RequireRole>
          }
        />

        <Route
          path="/admin/classifieds"
          element={
            <RequireRole roles={["superadmin", "admin"]}>
              <AdminClassifieds />
            </RequireRole>
          }
        />

        <Route
          path="/admin/messages"
          element={
            <RequireRole roles={["superadmin", "admin"]}>
              <AdminMessages />
            </RequireRole>
          }
        />

        <Route
          path="/admin/ranking"
          element={
            <RequireRole roles={["superadmin", "admin"]}>
              <AdminRanking />
            </RequireRole>
          }
        />

        <Route
          path="/admin/ranking-profiles"
          element={
            <RequireRole roles={["superadmin", "admin"]}>
              <AdminRankingProfiles />
            </RequireRole>
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/ranking"
          element={<Ranking />}
        />

        <Route
          path="/applicant/:id"
          element={
            <RequireAuth>
              <ApplicantDetail />
            </RequireAuth>
          }
        />

        <Route
          path="*"
          element={<NotFound />}
        />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
