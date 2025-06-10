import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Book,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code,
  FileCode,
  Layers,
  Lightbulb,
  MessageCircle,
  MonitorSmartphone,
  Zap,
  Users,
  Award,
  Briefcase,
  GraduationCap,
  Target,
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../lib/simplified-auth";
import { Button } from "../../components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { Card, CardContent } from "../../components/ui/card";
import { LeadCaptureDialog } from "../../components/leads/LeadCaptureDialog";

// Use images from the public assets folder
const venkateshImg = "/assets/venkatesh.jpeg";
const shreeImg = "/assets/shree.jpeg";
const ranjithImg = "/assets/ranjith.jpeg";
const logoImg = "/assets/Ignite Labs Logo Horizental.png";
const slide1Img = "/assets/Slide1.png";
const slide2Img = "/assets/Slide2.png";
const slide3Img = "/assets/Slide3.png";

export default function LandingPage() {
  const { user } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: slide1Img,
      title: "Become a Job-Ready Full Stack Developer",
      description:
        "Transform your career with our 1-year hands-on training program. No CS degree needed!",
    },
    {
      image: slide2Img,
      title: "Learn by Building Real Projects",
      description:
        "Our hands-on approach ensures you gain practical experience that employers value",
    },
    {
      image: slide3Img,
      title: "Master Modern Web Technologies",
      description:
        "Dive deep into React, Node.js, and full-stack development with expert guidance",
    },
  ];

  // Reset to slide 0 on component mount to ensure valid index
  useEffect(() => {
    setCurrentSlide(0);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* First Batch Announcement Banner */}
      <div className="w-full bg-primary text-primary-foreground py-2">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
            <p className="text-sm md:text-base font-medium flex items-center justify-center gap-2">
              <span className="animate-pulse">🔥</span>
              Inaugural Batch Starting June, 2025 - Early Bird Registration
              Open!
              <span className="hidden md:inline">Limited Seats Available.</span>
            </p>
            <LeadCaptureDialog
              buttonText="Register Now"
              formType="register"
              buttonVariant="secondary"
              buttonSize="sm"
              buttonClassName="font-bold whitespace-nowrap animate-pulse border border-white/30"
              buttonIcon={<ArrowRight className="ml-1 h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      <div className="bg-white w-full shadow-sm">
        <header className="container mx-auto py-0 flex justify-between items-center px-4 md:px-8">
         <div className="flex items-center gap-3">
  <img src={logoImg} alt="IgniteLabs Logo" className="h-14 md:h-24" />
</div>
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Why Us
            </a>
            <a
              href="#program"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Program
            </a>
            <a
              href="#approach"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Approach
            </a>
            <a
              href="#instructors"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Instructors
            </a>
            <a
              href="#faq"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              FAQ
            </a>
            <a
              href="#footer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Contact Us
            </a>
          </div>
          <div className="flex items-center gap-3">
            <LeadCaptureDialog
              buttonText="Contact Us"
              formType="contact"
              buttonSize="sm"
              buttonClassName="bg-primary hover:bg-primary/90 md:hidden"
              // id attribute is not needed and was causing an LSP error
            />
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/auth/login"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-[5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 right-1/3 w-6 h-6 bg-primary/30 rounded-full"></div>
          <div className="absolute top-1/3 left-1/4 w-4 h-4 bg-primary/20 rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-5 h-5 bg-primary/20 rounded-full"></div>
          <div className="absolute -inset-0.5 border-2 border-primary/5 rounded-3xl mx-4 my-8 hidden lg:block"></div>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 py-12 md:py-20 min-h-[550px] md:min-h-[650px]">
            {/* Content */}
            <div className="w-full lg:w-1/2 z-10">
              <div className="inline-block px-4 py-1 mb-4 rounded-full bg-primary/10 text-primary font-semibold text-sm border border-primary/20">
                Inaugural Batch - June 2025
              </div>
              <div className="h-[160px] md:h-[220px] relative mb-6">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      currentSlide === index
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                      {slide.title.split(" ").map((word, i) =>
                        i % 3 === 0 ? (
                          <span
                            key={i}
                            className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
                          >
                            {word}{" "}
                          </span>
                        ) : (
                          <span key={i}>{word} </span>
                        ),
                      )}
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-xl">
                      {slide.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Stats section */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8 max-w-md">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    100%
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Job Assistance
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    52+
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Weeks Program
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary">
                    20%
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    Early Bird Discount
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <LeadCaptureDialog
                  buttonText="Join First Batch"
                  formType="apply"
                  buttonSize="default"
                  buttonClassName="shadow-md shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary hover:to-primary/80 btn-pulse w-full md:w-auto"
                  buttonIcon={
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  }
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="border-primary/20 hover:bg-primary/5 w-full md:w-auto"
                >
                  Learn More
                </Button>
              </div>

              {/* Slide indicator dots */}
              <div className="flex gap-2 mt-6 md:mt-8 h-3">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-3 rounded-full transition-colors ${
                      currentSlide === index
                        ? "bg-primary w-6"
                        : "bg-muted w-3 hover:bg-primary/50"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Image with enhanced styling - Hidden on smallest screens */}
            <div className="w-full lg:w-1/2 relative mt-4 md:mt-0">
              {/* Background effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-2xl opacity-70"></div>

              {/* Image frame with professional styling */}
              <div className="relative bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-100 overflow-hidden">
                {/* Top pattern decoration */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80"></div>

                {/* Tag labels */}
                <div className="absolute top-4 right-4 z-10 hidden md:flex gap-2">
                  <span className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-full border border-primary/20 font-medium">
                    React.js
                  </span>
                  <span className="bg-primary/10 text-primary text-xs py-1 px-2 rounded-full border border-primary/20 font-medium">
                    Node.js
                  </span>
                </div>

                {/* Main image container */}
                <div className="relative h-[250px] md:h-[400px] w-full p-4 md:p-6">
                  {slides.map((slide, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        currentSlide === index
                          ? "opacity-100"
                          : "opacity-0 pointer-events-none"
                      }`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-contain rounded-lg"
                      />

                      {/* Caption text */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/80 to-white/0 p-3 text-center rounded-b-lg">
                        <span className="text-xs md:text-sm font-medium text-gray-700"></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation arrows with cleaner styling */}
                <div className="absolute top-1/2 left-3 right-3 -translate-y-1/2 flex justify-between pointer-events-none">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/90 backdrop-blur-sm pointer-events-auto border-primary/20 shadow-md hover:shadow-lg hover:bg-primary/10 h-7 w-7 md:h-8 md:w-8"
                    onClick={prevSlide}
                  >
                    <ChevronLeft className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                    <span className="sr-only">Previous slide</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full bg-background/90 backdrop-blur-sm pointer-events-auto border-primary/20 shadow-md hover:shadow-lg hover:bg-primary/10 h-7 w-7 md:h-8 md:w-8"
                    onClick={nextSlide}
                  >
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                    <span className="sr-only">Next slide</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why IgniteLabs */}
      <section id="features" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Why Choose
              </span>{" "}
              IgniteLabs?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our program goes beyond typical coding courses to provide a
              complete, industry-ready training experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Calendar className="h-10 w-10 text-primary" />}
              title="Real-World Training"
              description="Gain experience equivalent to 1 year in the industry through hands-on projects and professional workflows."
            />
            <FeatureCard
              icon={<Code className="h-10 w-10 text-primary" />}
              title="Project-Based Learning"
              description="Build real applications from scratch and complete real client projects to strengthen your portfolio."
            />
            <FeatureCard
              icon={<Lightbulb className="h-10 w-10 text-primary" />}
              title="For Everyone"
              description="No prior coding experience required. Open to all degree, B.Tech & intermediate students."
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-primary" />}
              title="100% Job Assistance"
              description="Resume building, interview preparation, and placement support to help you land your first tech role."
            />
          </div>

          <div className="mt-16 bg-primary/5 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Our Unique Training Approach
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Book className="h-6 w-6" />
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-center mb-2">
                  Expert Teaching
                </h4>
                <p className="text-center text-muted-foreground">
                  1 hour of focused instruction daily from industry
                  professionals
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FileCode className="h-6 w-6" />
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-center mb-2">
                  Hands-On Practice
                </h4>
                <p className="text-center text-muted-foreground">
                  6 hours of practical coding assignments and project work daily
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
                <h4 className="text-lg font-semibold text-center mb-2">
                  Expert Review
                </h4>
                <p className="text-center text-muted-foreground">
                  1 hour of code reviews, feedback and personalized mentorship
                  daily
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Program Structure */}
      <section
        id="program"
        className="py-16 md:py-24 bg-primary/5 relative overflow-hidden"
      >
        {/* Decorative floating badges - hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
          <div className="absolute top-20 left-[10%] px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium text-primary border border-primary/10 animate-float-slow">
            HTML & CSS
          </div>
          <div className="absolute top-40 right-[15%] px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium text-primary border border-primary/10 animate-float">
            JavaScript
          </div>
          <div className="absolute bottom-1/4 left-[20%] px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium text-primary border border-primary/10 animate-float-slow">
            React.js
          </div>
          <div className="absolute bottom-1/3 right-[10%] px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium text-primary border border-primary/10 animate-float">
            Node.js
          </div>
          <div className="absolute top-1/2 right-[30%] px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium text-primary border border-primary/10 animate-float-slow">
            MongoDB
          </div>
        </div>

        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Program
              </span>{" "}
              Structure
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive 52-week program takes you from the basics to
              advanced real-world projects.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto">
            {/* Central line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-primary/30 -translate-x-1/2 hidden md:block"></div>

            <div className="space-y-16 md:space-y-0">
              <ProgramStep
                number="1"
                title="Foundations"
                weeks="Weeks 1–4"
                description="Introduction to Full Stack Development & MERN Stack. Fundamentals of JavaScript, HTML, CSS, and Git. Setting up Development Environment and understanding MongoDB basics."
                position="left"
              />
              <ProgramStep
                number="2"
                title="Hands-on Project Building"
                weeks="Weeks 5–14"
                description="Build your first full-stack application. Frontend with React.js, Backend with Node.js & Express, connecting Frontend & Backend with APIs, Authentication & Authorization."
                position="right"
              />
              <ProgramStep
                number="3"
                title="Advanced Techniques & Team Collaboration"
                weeks="Weeks 15–16"
                description="Advanced React & State Management. Debugging & Performance Optimization. Agile Development, Git Workflow & Code Reviews. REST APIs & GraphQL Integration."
                position="left"
              />
              <ProgramStep
                number="4"
                title="Real-World Project Experience"
                weeks="Weeks 17–49"
                description="Work on Real Client Projects. Deployment & Cloud Computing. Payment Gateway Integration. Building scalable, secure applications. Portfolio Development."
                position="right"
              />
              <ProgramStep
                number="5"
                title="Career Preparation"
                weeks="Weeks 50–52"
                description="Resume Building & Personal Branding. Mock Interviews & Soft Skills Training. Job Assistance & Placement Support. Understanding SDLC & Agile Methodologies."
                position="left"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trainer & Learning Approach */}
      <section id="approach" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Trainer
                </span>{" "}
                & Learning Approach
              </h2>
              <p className="text-lg mb-6">
                Our unique teaching methodology combines expert instruction with
                extensive hands-on practice:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    1-Hour Daily Expert Teaching + 6-Hour Hands-on Assignments +
                    1-Hour Expert Review
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    Live Coding & Real-Time Problem-Solving with experienced
                    mentors
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    Weekly Code Reviews & Personal Mentorship for individualized
                    growth
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    R&D-based learning approach that mimics real-world
                    development
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    1-on-1 sessions to address your specific challenges
                  </span>
                </li>
              </ul>

              <blockquote className="border-l-4 border-primary pl-4 italic mt-8 text-lg text-muted-foreground">
                "Our mission is to transform students from any background into
                job-ready developers through real-world project experience and
                personalized mentorship."
                <footer className="mt-2 text-sm font-medium">
                  — Lead Trainer, IgniteLabs
                </footer>
              </blockquote>
            </div>

            <div className="border rounded-lg p-8">
              <h3 className="text-xl font-bold mb-4">
                Job Roles After Completing the Course
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <FileCode className="h-5 w-5 text-primary" />
                  </div>
                  <span>Full Stack Developer</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <span>Frontend Developer (React.js)</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <MonitorSmartphone className="h-5 w-5 text-primary" />
                  </div>
                  <span>Backend Developer (Node.js)</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-primary/10 p-2 rounded-full mr-3">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                  <span>Software Engineer</span>
                </li>
              </ul>

              <div className="mt-8">
                <h4 className="font-bold mb-2">Expected Salary Package</h4>
                <ul className="space-y-2">
                  <li>Entry-Level: ₹3 - ₹6 LPA</li>
                  <li>Mid-Level: ₹6 - ₹12 LPA</li>
                  <li>Senior-Level: ₹12 - ₹25+ LPA</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  (Subject to skill level, location, and company standards)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Instructors */}
      <section id="instructors" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Meet Our{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Industry Experts
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Learn from professionals with years of industry experience in
              building real-world applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center group">
              <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover:border-primary transition-all">
                <img
                  src={venkateshImg}
                  alt="Venkatesh Velisoju"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">Venkatesh Velisoju</h3>
              <p className="text-primary font-medium mb-2">
                Lead Instructor & Founder
              </p>
              <p className="text-muted-foreground">
                12+ years of experience as a technical leader. Passionate about
                education and creating real-world developers through hands-on
                training.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover:border-primary transition-all">
                <img
                  src={shreeImg}
                  alt="Shree Mandadi"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">Shree Mandadi</h3>
              <p className="text-primary font-medium mb-2">
                Industry Expert & Mentor
              </p>
              <p className="text-muted-foreground">
                35+ years of industry experience as a technology leader. Brings
                wealth of knowledge in software architecture, mentorship, and
                enterprise solutions.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-2 border-transparent group-hover:border-primary transition-all">
                <img
                  src={ranjithImg}
                  alt="Ranjith Velisoju"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold">Ranjith Velisoju</h3>
              <p className="text-primary font-medium mb-2">
                DevOps & Performance Expert
              </p>
              <p className="text-muted-foreground">
                10+ years specializing in DevOps practices, cloud
                infrastructure, and application performance optimization. Expert
                in modern deployment pipelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Early Bird Discount */}
      <section id="early-bird" className="py-16 md:py-24 bg-primary/5 border-y">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-lg border border-primary/20">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/3 flex justify-center">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-16 w-16 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full animate-pulse">
                      Limited Time!
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-2/3">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    Early Bird Registration Now Open!
                  </h2>
                  <div className="flex gap-2 items-center text-lg font-medium text-primary mb-4">
                    <span>First Batch Starting June 2025</span>
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <span>Limited Seats</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5" />
                      <span>
                        20% discount on full program fee for first batch
                        students
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5" />
                      <span>Free access to exclusive industry webinars</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary mt-0.5" />
                      <span>
                        Priority placement assistance after completion
                      </span>
                    </div>
                  </div>

                  <LeadCaptureDialog
                    buttonText="Secure Your Spot Today"
                    formType="register"
                    buttonSize="lg"
                    buttonClassName="w-full sm:w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Student Transformation Stories */}
      <section id="testimonials" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Student{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Transformation
              </span>{" "}
              Stories
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Hear from our graduates who transformed their careers through our
              program.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              name="Karthikeya M."
              quote="This program transformed my career! The real-world projects gave me confidence, and I landed a Full Stack Developer job within 2 months of completion!"
              role="BBA in Marketing"
            />
            <TestimonialCard
              name="Rambabu S."
              quote="I started with zero coding knowledge, and now I can build full-fledged applications! The best part is the hands-on approach and real-world training."
              role="MCA Graduate"
            />
            <TestimonialCard
              name="Devender B."
              quote="The corporate-style training was exactly what I needed. The interview preparation and placement support helped me secure a job with a top MNC!"
              role="B.com in Computers"
            />
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faq" className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Frequently Asked
              </span>{" "}
              Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Find answers to common questions about our program.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Who can join this program?</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Our program is open to:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>
                      <span className="font-medium">
                        Beginners & Non-Technical Students
                      </span>{" "}
                      - No prior coding experience required
                    </li>
                    <li>
                      <span className="font-medium">
                        B.Tech, Degree, and Intermediate Students
                      </span>{" "}
                      - Build a strong foundation for an IT career
                    </li>
                    <li>
                      <span className="font-medium">
                        Working Professionals & Career Switchers
                      </span>{" "}
                      - Transition into tech with confidence
                    </li>
                    <li>
                      <span className="font-medium">
                        Entrepreneurs & Business Owners
                      </span>{" "}
                      - Learn to build and launch your own web applications
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  What makes your training approach unique?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">Our training follows a unique formula:</p>
                  <ul className="list-disc pl-6 space-y-1 mb-2">
                    <li>
                      <span className="font-medium">
                        1-Hour Daily Expert Teaching
                      </span>{" "}
                      +{" "}
                      <span className="font-medium">
                        6-Hour Hands-on Assignments
                      </span>{" "}
                      +{" "}
                      <span className="font-medium">1-Hour Expert Review</span>
                    </li>
                    <li>Live coding sessions with real-time problem-solving</li>
                    <li>Weekly code reviews and personal mentorship</li>
                    <li>
                      Internship-like training experience with real projects
                    </li>
                  </ul>
                  <p>
                    Our approach is 100% focused on practical skill development
                    and corporate readiness, not just theoretical concepts.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  What job roles can I apply for after completion?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">
                    After completing our program, you'll be qualified for
                    various positions including:
                  </p>
                  <ul className="list-disc pl-6 grid grid-cols-1 md:grid-cols-2 gap-1 mb-2">
                    <li>Full Stack Developer</li>
                    <li>Frontend Developer (React.js)</li>
                    <li>Backend Developer (Node.js)</li>
                    <li>Software Engineer</li>
                    <li>DevOps Engineer</li>
                    <li>Web Application Developer</li>
                  </ul>
                  <p className="mb-2">
                    <span className="font-medium">
                      Expected salary packages:
                    </span>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Entry-Level: ₹3 - ₹6 LPA</li>
                    <li>Mid-Level: ₹6 - ₹12 LPA</li>
                    <li>Senior-Level: ₹12 - ₹25+ LPA</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-2">
                    (Subject to skill level, location, and company standards)
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>
                  What is the program duration and structure?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">
                    The full program is{" "}
                    <span className="font-medium">1 year (52 weeks)</span>{" "}
                    divided into 5 comprehensive phases:
                  </p>
                  <ol className="list-decimal pl-6 space-y-1">
                    <li>
                      <span className="font-medium">Foundations</span> (Weeks
                      1-4): JavaScript, HTML, CSS, Git fundamentals
                    </li>
                    <li>
                      <span className="font-medium">
                        Hands-on Project Building
                      </span>{" "}
                      (Weeks 5-16): Building full-stack applications
                    </li>
                    <li>
                      <span className="font-medium">
                        Advanced Techniques & Team Collaboration
                      </span>{" "}
                      (Weeks 17-20): State management, debugging, code reviews
                    </li>
                    <li>
                      <span className="font-medium">
                        Real-World Project Experience
                      </span>{" "}
                      (Weeks 20-49): Client projects, deployment, portfolio
                      development
                    </li>
                    <li>
                      <span className="font-medium">Career Preparation</span>{" "}
                      (Weeks 50-52): Resume building, interview prep, job
                      assistance
                    </li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>
                  Will I receive job assistance after completion?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">
                    <span className="font-medium">Yes, absolutely!</span> We
                    provide 100% job assistance including:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Resume and LinkedIn profile building</li>
                    <li>Portfolio development guidance</li>
                    <li>Mock interviews and soft skills training</li>
                    <li>Direct referrals to our hiring partners</li>
                    <li>Interview preparation for technical and HR rounds</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>
                  Do I need prior coding experience?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="font-medium">No, absolutely not!</p>
                  <p className="mt-2">
                    Our program is specially designed for beginners and
                    non-technical students with zero coding experience. We
                    welcome students from all backgrounds and start from the
                    very basics.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7">
                <AccordionTrigger>
                  Is the program online or offline?
                </AccordionTrigger>
                <AccordionContent>
                  <p>
                    We offer{" "}
                    <span className="font-medium">hybrid learning</span> with
                    both online and offline options. You can choose the format
                    that works best for you, with flexible schedules available
                    to accommodate different needs.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8">
                <AccordionTrigger>
                  Will I get to work on real projects?
                </AccordionTrigger>
                <AccordionContent>
                  <p className="mb-2">
                    <span className="font-medium">Yes!</span> Our program is
                    heavily focused on real-world projects:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>You'll build multiple applications from scratch</li>
                    <li>Work on real client projects in the latter phases</li>
                    <li>
                      Implement payment gateways and other advanced features
                    </li>
                    <li>Develop a professional portfolio of real projects</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-background border-t text-foreground">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
                Ready to{" "}
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Transform Your Career
                </span>
                ?
              </h2>
              <p className="text-xl mb-2 max-w-3xl mx-auto">
                Secure your spot for the inaugural batch starting June 2025
              </p>
              <p className="text-primary font-medium">
                Early bird offer ends soon! Limited seats available.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-primary" />
                  Schedule a Free Consultation
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Speak with our program advisors about your career goals and
                  get personalized guidance on how our program can help you
                  succeed.
                </p>
                <LeadCaptureDialog
                  buttonText="Book a Call"
                  formType="bookCall"
                  buttonSize="lg"
                  buttonVariant="outline"
                  buttonClassName="w-full"
                />
              </div>

              <div className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <GraduationCap className="mr-2 h-5 w-5 text-primary" />
                  Apply for First Batch
                </h3>
                <p className="mb-4 text-muted-foreground">
                  Submit your application for our inaugural batch and take
                  advantage of the exclusive early bird offer with a 20%
                  discount.
                </p>
                <LeadCaptureDialog
                  buttonText="Apply Now"
                  formType="apply"
                  buttonSize="lg"
                  buttonClassName="w-full group"
                  buttonIcon={
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  }
                />
              </div>
            </div>

            <div className="text-center p-6 border border-primary/20 rounded-lg bg-primary/5">
              <h3 className="text-xl font-bold mb-4">
                Join Our Upcoming Info Session
              </h3>
              <p className="mb-4">
                Learn more about our program in our free virtual info session on{" "}
                <span className="font-medium">May 20, 2025 at 6:00 PM IST</span>
              </p>
              <LeadCaptureDialog
                buttonText="Register for Info Session"
                formType="infoSession"
                buttonVariant="outline"
              />

              <div className="mt-8 pt-6 border-t">
                <p className="text-lg font-medium mb-3">
                  Have questions? Contact us directly:
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="tel:+919494644848"
                    className="flex items-center justify-center gap-2 text-primary hover:underline"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    +91 9494 64 4848
                  </a>
                  <a
                    href="tel:+917287820821"
                    className="flex items-center justify-center gap-2 text-primary hover:underline"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    +91 7287 820 821
                  </a>
                  <a
                    href="mailto:support@ignitelabs.co.in"
                    className="flex items-center justify-center gap-2 text-primary hover:underline"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    support@ignitelabs.co.in
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-background border-t py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-8">
          {/* Main footer content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-3 md:mb-4">
                <img
                  src="/assets/ignite-labs-icon.png"
                  alt="IgniteLabs Icon"
                  className="h-7 w-7 md:h-8 md:w-8"
                />
                <span className="font-bold text-base md:text-lg">
                  IgniteLabs
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transforming non-CS graduates into job-ready Full Stack
                Developers.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">
                Contact
              </h3>
              <address className="not-italic text-sm text-muted-foreground">
                Pochammaidan, Jakotia Complex, <br />
                3rd Floor, Warangal, <br />
                Telangana, India
              </address>
              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <a
                    href="tel:+919494644848"
                    className="text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    +91 9494 64 4848
                  </a>
                </p>
                <p>
                  <a
                    href="tel:+917287820821"
                    className="text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    +91 7287 820 821
                  </a>
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">
                Quick Links
              </h3>
              <ul className="space-y-1 md:space-y-2 text-sm">
                <li>
                  <a
                    href="#features"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Why IgniteLabs
                  </a>
                </li>
                <li>
                  <a
                    href="#program"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Program Structure
                  </a>
                </li>
                <li>
                  <a
                    href="#approach"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Learning Approach
                  </a>
                </li>
                <li>
                  <a
                    href="#instructors"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Our Experts
                  </a>
                </li>
                <li>
                  <a
                    href="#early-bird"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Early Bird Offer
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Success Stories
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="text-muted-foreground hover:text-primary"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">
                Legal
              </h3>
              <ul className="space-y-1 md:space-y-2 text-sm">
                <li>
                  <Link
                    to="/terms-of-service"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy-policy"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/refund-policy"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Google Maps Location - adjusted for mobile */}
          <div className="mt-8 md:mt-12">
            <div className="w-full max-w-3xl mx-auto rounded-lg overflow-hidden shadow-md">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3794.772559134323!2d79.59989329999999!3d17.989315599999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a3345004ceffdcd%3A0xa98e988877ea1bda!2sIgnite%20Labs!5e0!3m2!1sen!2sin!4v1744285087402!5m2!1sen!2sin"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="IgniteLabs Location"
                className="md:h-[350px]"
              ></iframe>
            </div>
          </div>

          {/* Social Media Links & Copyright */}
          <div className="border-t mt-8 md:mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs md:text-sm text-center md:text-left text-muted-foreground">
              &copy; {new Date().getFullYear()} IgniteLabs. All rights reserved.
            </p>

            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a
                href="https://www.linkedin.com/company/ignitelabsofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 hover:bg-primary/10 text-muted-foreground hover:text-primary p-2 rounded-full transition-colors"
                aria-label="LinkedIn"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/ignitelabsofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 hover:bg-primary/10 text-muted-foreground hover:text-primary p-2 rounded-full transition-colors"
                aria-label="Instagram"
              >
                <span className="sr-only">Instagram</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@IgniteLabsOfficial"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 hover:bg-primary/10 text-muted-foreground hover:text-primary p-2 rounded-full transition-colors"
                aria-label="YouTube"
              >
                <span className="sr-only">YouTube</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component for feature cards in the "Why IgniteLabs" section
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="h-full hover:border-primary hover:shadow-md transition-all duration-300 hover-lift group relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out"></div>

      <CardContent className="pt-6 relative z-10">
        <div className="mb-4 bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:bg-primary/15 transition-all duration-300 group-hover:-translate-y-1">
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-primary group-hover:text-gradient transition-colors duration-300">
          {title}
        </h3>
        <p className="text-muted-foreground">{description}</p>

        <div className="w-1.5 h-1.5 bg-primary/50 rounded-full mx-auto mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </CardContent>

      <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </Card>
  );
}

// Component for program steps in the "Program Structure" section
function ProgramStep({
  number,
  title,
  weeks,
  description,
  position,
}: {
  number: string;
  title: string;
  weeks: string;
  description: string;
  position: "left" | "right";
}) {
  return (
    <div
      className={`relative group mb-10 md:mb-12 md:grid md:grid-cols-2 md:gap-8 ${position === "right" ? "md:text-right" : ""}`}
    >
      {/* Mobile view with simplified layout */}
      <div className="block md:hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-3 bg-primary/5 border-b border-gray-100">
            <div className="text-primary font-medium text-xs px-2 py-1 rounded bg-white/80 shadow-sm">
              {weeks}
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
              {number}
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-base font-bold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div
        className={`hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10`}
      >
        <div className="absolute w-20 h-20 rounded-full bg-primary/20 animate-pulse-slow opacity-70"></div>

        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground font-bold shadow-md group-hover:scale-110 transition-transform text-xl relative z-10">
          {number}

          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute -inset-full top-0 right-0 w-1/2 h-1/2 bg-gradient-to-r from-transparent to-white/20 transform rotate-45 translate-x-[200%] translate-y-[100%] group-hover:translate-x-[60%] group-hover:translate-y-[60%] transition-transform duration-700"></div>
          </div>
        </div>
      </div>

      <div
        className={`hidden md:block pt-0 pb-8 ${position === "right" ? "md:col-start-2" : "md:col-start-1"}`}
      >
        <div
          className={`mb-3 md:mb-4 space-y-2 md:space-y-0 ${position === "right" ? "md:flex md:flex-col md:items-end" : ""}`}
        >
          <h3 className="text-xl font-bold group-hover:text-gradient transition-colors duration-300">
            {title}
          </h3>
          <span className="inline-block text-sm font-medium px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/5 shadow-sm">
            {weeks}
          </span>
        </div>
        <div
          className={`bg-white p-4 md:p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group-hover:border-primary/20 border border-transparent relative ${position === "right" ? "" : ""}`}
        >
          <div
            className={`absolute ${position === "right" ? "top-0 left-0 rounded-tl-lg" : "top-0 right-0 rounded-tr-lg"} w-8 h-8 bg-primary/5 transform origin-center scale-0 group-hover:scale-100 transition-transform duration-300`}
          ></div>

          <p className="text-muted-foreground relative z-10">{description}</p>
        </div>
      </div>

      <div
        className={`hidden md:block ${position === "right" ? "md:col-start-1" : "md:col-start-2"}`}
      ></div>
    </div>
  );
}

// Component for testimonial cards in the "Student Transformation Stories" section
function TestimonialCard({
  name,
  quote,
  role,
}: {
  name: string;
  quote: string;
  role: string;
}) {
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/40 hover-lift group relative overflow-hidden">
      <div className="absolute -top-6 -right-6 text-9xl opacity-5 font-serif">
        "
      </div>

      <CardContent className="pt-6 relative z-10">
        <div className="mb-4 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:bg-primary/15 transition-all duration-300">
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>
        <blockquote className="text-lg mb-6 italic text-muted-foreground">
          "{quote}"
        </blockquote>
        <div className="border-t pt-4 border-primary/10 relative">
          <div className="absolute -top-1.5 left-0 w-3 h-3 bg-primary/20 rounded-full"></div>

          <p className="font-bold text-lg group-hover:text-gradient transition-colors duration-300">
            {name}
          </p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
}
