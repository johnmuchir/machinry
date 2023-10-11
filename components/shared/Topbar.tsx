import { OrganizationSwitcher, SignedIn, SignOutButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import Image from "next/image";

function Topbar() {
    return (
        <nav className="topbar">
            <Link href='/' className='flex items-center gap-1'>
               <Image src='/assets/logo.png' alt='logo' width={60} height={60} className="rounded-lg" />
               <p className='text-heading 3-bold text-light-1 max-xs:hidden'>Machinry</p>
            </Link>

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
                <OrganizationSwitcher
                    appearance={{
                        baseTheme: dark,
                        elements: {
                            organizationSwitcherTrigger: "pt-2 px-2",
                        },
                    }}
                />
            </div>
        </nav>


    )
}

export default Topbar;