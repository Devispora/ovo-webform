import { Link } from "remix";

export default function Index() {
    return (
        <div>
            <section className="w-full px-6 antialiased">
                <div className="mx-auto max-w-7xl">
                    <div className="container max-w-lg px-4 py-32 mx-auto text-left md:max-w-none md:text-center justify-center">
                        <div className="flex flex-col items-center">
                            <img
                                className="w-80 h-80"
                                src="OvO.png"
                                alt="OvO Logo"
                            ></img>
                        </div>
                        <h1 className="font-extrabold leading-10 tracking-tight text-leftmd:text-center sm:leading-none md:text-6xl lg:text-7xl">
                            <span className="inline md:block text-neutral-focus">
                                Planetside Battles
                            </span>
                            <span className="relative mt-3 text-primary md:inline-block">
                                OvO
                            </span>
                        </h1>
                        <div className="flex flex-col items-center mt-8 text-center font-medium">
                            <span className="relative inline-flex w-full md:w-auto">
                                <Link
                                    to="/reserve"
                                    type="button"
                                    className="btn btn-primary btn-lg"
                                >
                                    <p className="normal-case font-medium">Reserve Bases</p>
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
