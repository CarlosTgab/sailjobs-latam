import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageBackground from "./components/PageBackground";

import {
  RequireAuth,
  RequireRole,
  RequireProfile,
  RequireClubAccess
} from "./components/RouteGuards";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";

import Calendar from "./pages/Calendar";
import EventDetail from "./pages/EventDetail";

import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import EditJob from "./pages/EditJob";

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

import CoachDashboard from "./pages/CoachDashboard";
import UserDashboard from "./pages/UserDashboard";

import OrganizationAdminDashboard from "./pages/OrganizationAdminDashboard";

import AdminDashboard from "./pages/AdminDashboard";
import AdminEvents from "./pages/AdminEvents";
import AdminMessages from "./pages/AdminMessages";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Ranking from "./pages/Ranking";

import ApplicantDetail from "./pages/ApplicantDetail";
import NotFound from "./pages/NotFound";

import "./App.css";

function App() {

  return (

    <BrowserRouter>

      <PageBackground />

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Home />}
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
          path="/calendar"
          element={<Calendar />}
        />

        <Route
          path="/calendar/:id"
          element={<EventDetail />}
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
          element={

            <RequireClubAccess>

              <CreateEvent />

            </RequireClubAccess>

          }
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
          element={

            <RequireAuth>

              <UserDashboard />

            </RequireAuth>

          }
        />

        <Route
          path="/coach-dashboard"
          element={

            <RequireProfile profile="professional">

              <CoachDashboard />

            </RequireProfile>

          }
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
          path="/superadmin"
          element={

            <RequireRole
              roles={[
                "superadmin",
                "admin"
              ]}
            >

              <AdminDashboard />

            </RequireRole>

          }
        />

        <Route
          path="/admin"
          element={

            <Navigate
              to="/superadmin"
              replace
            />

          }
        />

        <Route
          path="/admin/events"
          element={

            <RequireRole
              roles={[
                "superadmin",
                "admin"
              ]}
            >

              <AdminEvents />

            </RequireRole>

          }
        />

        <Route
          path="/admin/messages"
          element={

            <RequireRole
              roles={[
                "superadmin",
                "admin"
              ]}
            >

              <AdminMessages />

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