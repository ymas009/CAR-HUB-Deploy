import React from "react";
import {
  CalendarDays,
  Mountain,
  Waves,
  Castle,
  SunMedium,
  UsersRound,
  Heart,
  SlidersHorizontal,
  Search,
  MapPin,
  Clock3,
  ArrowRight,
  Navigation,
  Star,
  ShieldCheck,
  BadgeIndianRupee,
} from "lucide-react";
import "./MaharashtraDestinations.css";

import bgImage from "../assets/maharashtra-travel/pune-maharashtra-bg.svg";
import lonavala from "../assets/maharashtra-travel/lonavala-hills.svg";
import mahabaleshwar from "../assets/maharashtra-travel/mahabaleshwar-viewpoint.svg";
import alibaug from "../assets/maharashtra-travel/alibaug-beach.svg";
import matheran from "../assets/maharashtra-travel/matheran-toytrain.svg";
import lavasa from "../assets/maharashtra-travel/lavasa-lake.svg";
import nashik from "../assets/maharashtra-travel/nashik-vineyard.svg";
import shirdi from "../assets/maharashtra-travel/shirdi-temple.svg";
import kolad from "../assets/maharashtra-travel/kolad-rafting.svg";

const categories = [
  { label: "Weekend Trips", icon: CalendarDays, active: true },
  { label: "Hill Stations", icon: Mountain },
  { label: "Beaches", icon: Waves },
  { label: "Forts", icon: Castle },
  { label: "One Day Trip", icon: SunMedium },
  { label: "Family Tour", icon: UsersRound },
  { label: "Couple Trip", icon: Heart },
  { label: "Adventure", icon: Mountain },
];

const trips = [
  {
    from: "Pune",
    to: "Lonavala",
    subtitle: "Hills & Waterfall Escape",
    days: "1-2 Days",
    distance: "65 km",
    price: "₹1,499",
    tag: "Best Weekend",
    tagClass: "green",
    image: lonavala,
  },
  {
    from: "Pune",
    to: "Mahabaleshwar",
    subtitle: "Strawberry Hill Retreat",
    days: "2-3 Days",
    distance: "120 km",
    price: "₹3,499",
    tag: "Hill Station",
    tagClass: "blue",
    image: mahabaleshwar,
  },
  {
    from: "Pune",
    to: "Alibaug",
    subtitle: "Beach Weekend Getaway",
    days: "2 Days",
    distance: "145 km",
    price: "₹2,999",
    tag: "Beach Trip",
    tagClass: "sky",
    image: alibaug,
  },
  {
    from: "Pune",
    to: "Matheran",
    subtitle: "Toy Train & Forest Trails",
    days: "2 Days",
    distance: "125 km",
    price: "₹2,499",
    tag: "No Vehicle Zone",
    tagClass: "orange",
    image: matheran,
  },
  {
    from: "Pune",
    to: "Lavasa",
    subtitle: "Lake City Day Tour",
    days: "1 Day",
    distance: "60 km",
    price: "₹1,299",
    tag: "One Day Trip",
    tagClass: "purple",
    image: lavasa,
  },
  {
    from: "Pune",
    to: "Nashik",
    subtitle: "Vineyard & Temple Route",
    days: "2 Days",
    distance: "210 km",
    price: "₹3,999",
    tag: "Family Route",
    tagClass: "green",
    image: nashik,
  },
  {
    from: "Pune",
    to: "Shirdi",
    subtitle: "Sai Baba Darshan Package",
    days: "1-2 Days",
    distance: "185 km",
    price: "₹2,199",
    tag: "Devotional",
    tagClass: "gold",
    image: shirdi,
  },
  {
    from: "Pune",
    to: "Kolad",
    subtitle: "River Rafting Adventure",
    days: "1-2 Days",
    distance: "115 km",
    price: "₹2,799",
    tag: "Adventure",
    tagClass: "royal",
    image: kolad,
  },
];

const stats = [
  { value: "80+", label: "Maharashtra Routes", icon: Navigation },
  { value: "25K+", label: "Happy Travelers", icon: UsersRound },
  { value: "4.8★", label: "Overall Rating", icon: Star },
  { value: "Local", label: "Verified Packages", icon: ShieldCheck },
];

export default function MaharashtraDestinations() {
  return (
    <section className="mhExplore" style={{ "--mh-bg": `url(${bgImage})` }}>
      <div className="mhExplore__overlay" />

      <div className="mhExplore__content">
        <p className="mhEyebrow">MAHARASHTRA GETAWAYS</p>

        <h1>
          Explore Maharashtra from <span>Pune.</span>
        </h1>

        <p className="mhSubtitle">
          Lonavala, Mahabaleshwar, Alibaug, forts, beaches and weekend trips curated for Pune travelers.
        </p>

        <div className="mhSearchBox">
          <Search size={27} />
          <input
            type="text"
            placeholder="Search Lonavala, Mahabaleshwar, Alibaug, Shirdi..."
          />
          <button aria-label="Open filters">
            <SlidersHorizontal size={26} />
          </button>
        </div>

        <div className="mhCategoryRow">
          {categories.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`mhCategoryChip ${item.active ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button className="mhRoundArrow" aria-label="Next categories">
            <ArrowRight size={24} />
          </button>
        </div>

        <div className="mhSectionHead">
          <h2>Popular Maharashtra routes from Pune</h2>
          <p>Handpicked short trips with distance, duration and starting package price.</p>
        </div>

        <div className="mhTripGrid">
          {trips.map((trip) => (
            <article className="mhTripCard" key={trip.to}>
              <div className="mhTripImage">
                <img src={trip.image} alt={`${trip.from} to ${trip.to}`} />
                <span className={`mhTripTag ${trip.tagClass}`}>{trip.tag}</span>
              </div>

              <div className="mhTripBody">
                <h3>
                  {trip.from} <span>→</span> {trip.to}
                </h3>

                <p>{trip.subtitle}</p>

                <div className="mhMetaRow">
                  <span>
                    <Clock3 size={15} /> {trip.days}
                  </span>
                  <span>
                    <MapPin size={15} /> {trip.distance}
                  </span>
                </div>

                <div className="mhPrice">
                  <BadgeIndianRupee size={18} />
                  <strong>{trip.price}</strong>
                  <span>onwards</span>
                </div>

                <button className="mhExploreBtn">
                  View Package <ArrowRight size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mhStatsBar">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div className="mhStatItem" key={stat.label}>
                <Icon size={36} />
                <div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="mhFloatingArrow" aria-label="Next routes">
        <ArrowRight size={28} />
      </button>
    </section>
  );
}
