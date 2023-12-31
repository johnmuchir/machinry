import { currentUser, OrganizationSwitcher, SignedIn, SignOutButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.action";

async function Topbar() {
    const user = await currentUser();
    
    if (!user) return null;

    const userInfo = await fetchUser(user.id);

    if (!userInfo?.onboarded) redirect("/onboarding");

    
    return (
        <nav className="topbar">
            <Link href='/' className='flex items-center gap-1'>
               <Image 
                   src='/assets/logo-1.png' 
                   alt='logo' 
                   width={40}
                   height={40}
                   priority
                   className="rounded-lg" 
                />
               <p className='cursor-pointer p-1 overflow-hidden text-[12px] rounded-lg bg-gradient-to-r from-pink-500 to-yellow-500 ... max-xs:hidden'>Machinary</p>
            </Link>

            <Link href='/profile/edit'>
            <Image
                src={userInfo?.image}
                alt='user_community_image'
                width={40}
                height={40}
                className='cursor-pointer rounded-full'
              />
            </Link>

            {/*<OrganizationSwitcher
                appearance={{
                    baseTheme: dark,
                    elements: {
                        organizationSwitcherTrigger: "pt-2 px-2",
                    },
                }}
            />*/}

            <div className='flex items-center gap-1'>
                <div className='block md:hidden'>
                    <SignedIn>
                    <SignOutButton>
                    <div className='flex cursor-pointer'>
                        <Image
                           src='/assets/logout.svg'
                           alt='logout'
                           width={24}
                           height={24}
                        />
                    </div>
                    </SignOutButton>
                    </SignedIn>
                </div>
                
            </div>
        </nav>
    )
}

export default Topbar;