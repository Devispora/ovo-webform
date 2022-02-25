import { Link } from "remix";

export default function Index() {
    return (
        <div>
            <section className="w-full px-6 antialiased">
                <div className="mx-auto max-w-7xl">
                    <div className="container mx-auto max-w-lg justify-center px-4 py-32 text-left md:max-w-none md:text-center">
                        <div className="flex flex-col items-center">
                            <img
                                className="h-80 w-80"
                                src="OvO.png"
                                alt="OvO Logo"
                            ></img>
                        </div>
                        <h1 className="text-leftmd:text-center font-extrabold leading-10 tracking-tight sm:leading-none md:text-6xl lg:text-7xl">
                            <span className="inline text-neutral-focus md:block">
                                Planetside Battles
                            </span>
                            <span className="relative mt-3 text-primary md:inline-block">
                                OvO
                            </span>
                        </h1>
                        <div className="mt-8 flex flex-col items-center text-center font-medium">
                            <span className="relative inline-flex w-full md:w-auto">
                                <Link
                                    to="/reserve"
                                    type="button"
                                    className="btn btn-primary btn-lg"
                                >
                                    <p className="font-medium normal-case">
                                        Reserve Bases
                                    </p>
                                </Link>
                            </span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
