import LoginForm from "@/components/auth/loginForm";
import Wall from "@/components/ui/wall";
import Image from "next/image";
// This is the login page of the application

export default function page() {
  return (
    <div className="grid md:grid-cols-[40%_60%] h-4/5 w-4/5 bg-white rounded-lg shadow-lg">
      <Wall
        className="md:flex items-center justify-center h-full w-full bg-gradient-to-br 
    from-black via-gray-950 to-[#666666] rounded-l-lg hidden"
        content={
          <Image
            src="/assets/favicon.ico"
            alt="Wall Image"
            width={60}
            height={60}
          />
        }
      />
      <LoginForm />
    </div>
  );
}
