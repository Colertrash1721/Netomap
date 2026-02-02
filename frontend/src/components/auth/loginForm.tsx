"use client";
import React from "react";
import Inputs from "../ui/inputs";
import useLoginForm from "@/hooks/auth/useLoginForm";
import { LoginFail } from "@/components/ui/alert";
import { LoginSucess } from "@/components/ui/alert";

export default function LoginForm() {
  const { handleInputs, handleChange, handleSubmit, successMessage, errorMessage } = useLoginForm();

  return (
    <section className="flex flex-col items-center justify-center h-full w-full bg-white rounded-r-lg">
      {errorMessage && <LoginFail descriptionFail={errorMessage} />}
      {successMessage && <LoginSucess descriptionSucess={successMessage} />}
      <h1 className="text-black text-4xl">Login</h1>
      <form
        className="flex flex-col gap-4 w-full items-center justify-center p-4"
        onSubmit={handleSubmit}
      >
        <Inputs
          label={"Username"}
          type="text"
          value={handleInputs.username}
          onChange={handleChange}
          icon="bx-user"
        />
        <Inputs
          label="Password"
          type="password"
          value={handleInputs.password}
          onChange={handleChange}
          icon="bx-lock"
        />
        <button
          type="submit"
          className="bg-black relative text-white text-2xl tracking-[2px] rounded w-3/4 p-2 after:content-[''] after:absolute after:top-0 after:left-[-100%] after:w-full after:h-full after:bg-blue-300 hover:after:left-0 transition-all after:transition-all overflow-hidden cursor-pointer h-12 hover:shadow-lg hover:scale-105 active:scale-95 active:shadow-none"
        >
          <span className="z-10 absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
            Login
          </span>
        </button>
      </form>
    </section>
  );
}
