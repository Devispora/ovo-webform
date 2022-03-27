export interface ErrorProps {
    channelLink?: string;
}

export default function ErrorComponent(props: ErrorProps) {
    return (
        <div className="m-auto grid h-screen w-screen place-content-center">
            <p className="text-9xl font-extrabold text-red-900">
                An error has occurred!
            </p>
            <p className="text-lg font-semibold">
                Please try again. If the service continues to have issues,
                please{" "}
                {props.channelLink ? (
                    <a
                        className="text-blue-600 underline visited:text-purple-600 hover:text-blue-800"
                        href={props.channelLink}
                    >
                        contact
                    </a>
                ) : (
                    "contact"
                )}{" "}
                an OvO Admin.
            </p>
        </div>
    );
}
