import type { Metadata } from "next";
import Footer from "../common/Footer";
import Header from "../common/Header";
import Hero from "./components/Hero";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "AISGWB" };

const Landing = () => {
  redirect("/auth/sign-in");
  return (
    <div className="bg-body-secondary">
      <Header />
      <Hero />
      <Footer />
    </div>
  );
};

export default Landing;
