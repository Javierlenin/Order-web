import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./page/AuthPages/SignIn";
import SignUp from "./page/AuthPages/SignUp";
import NotFound from "./page/OtherPage/NotFound";
import UserProfiles from "./page/UserProfiles";
import Videos from "./page/UiElements/Videos";
import Images from "./page/UiElements/Images";
import Alerts from "./page/UiElements/Alerts";
import Badges from "./page/UiElements/Badges";
import Avatars from "./page/UiElements/Avatars";
import Buttons from "./page/UiElements/Buttons";
import LineChart from "./page/Charts/LineChart";
import BarChart from "./page/Charts/BarChart";
import Calendar from "./page/Calendar";
import BasicTables from "./page/Tables/BasicTables";
import FormElements from "./page/Forms/FormElements";
import Blank from "./page/Blank";
import AppLayout from "./components/layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./page/Dashboard/Home";
import { UsersPage } from "./page/UsersPage";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
