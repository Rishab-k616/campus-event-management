const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const filters = document.querySelectorAll(".filter");
const eventCards = document.querySelectorAll(".event-card");
const form = document.querySelector(".event-form");
const message = document.querySelector(".form-message");
const graphNodes = document.querySelectorAll(".graph-node");
const graphDetail = document.querySelector("#graph-detail");

const graphInsights = {
  events: {
    label: "Hub",
    title: "GU status-driven events",
    text: "The graph shows EventStatus as a core abstraction, so the GU portal highlights pending, approved, live, rejected, and completed event movement."
  },
  roles: {
    label: "Roles",
    title: "Student, department, and registrar paths",
    text: "UserRole is the most connected domain model, so GU access control should shape every action from discovery to registrar approval."
  },
  api: {
    label: "API",
    title: "Public and managed GU event routes",
    text: "The event API cluster supports create, update, delete, pending, my-events, public events, and live events for the GU portal."
  },
  auth: {
    label: "Auth",
    title: "GU login and secure sessions",
    text: "The auth community connects register, login, profile, token creation, and password verification into one onboarding flow."
  },
  notifications: {
    label: "Comms",
    title: "Notifications and GU notices",
    text: "NotificationResponse and notice endpoints support unread counts, read states, and updates for students, departments, and organizers."
  },
  departments: {
    label: "Data",
    title: "Faculty and department discovery",
    text: "Department extraction appears as its own endpoint, so filtering GU events by faculty and department belongs in the product experience."
  }
};

const syncHeader = () => {
  header.classList.toggle("scrolled", window.scrollY > 24);
};

syncHeader();
window.addEventListener("scroll", syncHeader);

toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.tagName === "A") {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.filter;

    filters.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    eventCards.forEach((card) => {
      const shouldShow = category === "all" || card.dataset.category === category;
      card.classList.toggle("hidden", !shouldShow);
    });
  });
});

graphNodes.forEach((button) => {
  button.addEventListener("click", () => {
    const insight = graphInsights[button.dataset.module];
    if (!insight || !graphDetail) {
      return;
    }

    graphNodes.forEach((node) => node.classList.remove("active"));
    button.classList.add("active");
    graphDetail.querySelector("span").textContent = insight.label;
    graphDetail.querySelector("h3").textContent = insight.title;
    graphDetail.querySelector("p").textContent = insight.text;
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const eventName = data.get("eventName") || "Your event";

  message.textContent = `${eventName} has been drafted for Gauhati University review.`;
  form.reset();
});
