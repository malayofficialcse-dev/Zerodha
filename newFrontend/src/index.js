// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import './index.css';
// import HomePage from './landing_page/home/HomePage';
// import {BrowserRouter,Routes,Route} from 'react-router-dom'

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <BrowserRouter>
//     <Routes>
//       <Route path='/' element={<HomePage/>}></Route>
//             <Route path='/signup' element={<Signup/>}></Route>
//       <Route path='/about' element={<HomePage/>}></Route>
//       <Route path='/product' element={<HomePage/>}></Route>
//       <Route path='/pricing' element={<HomePage/>}></Route>
//       <Route path='/support' element={<HomePage/>}></Route>

//     </Routes>
//   </BrowserRouter>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import HomePage from "./landing_page/home/HomePage.jsx";
import Login from "./landing_page/signup/Login.jsx";
import Signup from "./landing_page/signup/Signup.jsx";
import AboutPage from "./landing_page/about/AboutPage.jsx";
import ProductsPage from "./landing_page/products/ProductsPage.jsx";
import PricingPage from "./landing_page/pricing/PricingPage.jsx";
import SupportPage from "./landing_page/support/SupportPage.jsx";

import NotFound from "./landing_page/NotFound.jsx";
import Navbar from "./landing_page/Navbar.jsx";
import Footer from "./landing_page/Footer.jsx";

import { ThemeProvider } from "./ThemeContext.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ThemeProvider>
    <BrowserRouter>
    <Navbar />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/product" element={<ProductsPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Footer />
    </BrowserRouter>
  </ThemeProvider>
);
