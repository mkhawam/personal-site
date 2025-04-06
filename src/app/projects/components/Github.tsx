"use client";
import React, { useEffect } from "react";
import { FaGithub } from "react-icons/fa";
import { format } from "date-fns";

type Props = {
    username: string;
    repo: string;
}

export function Github({ username, repo }: Props) {
    const [data, setData] = React.useState<{
        name: string;
        description: string;
        created_at: string;
        updated_at: string;
        stargazers_count: number;
        forks_count: number;
        open_issues_count: number;
        owner: {
            login: string;
            avatar_url: string;
            html_url: string;
        };
    } | null>(null);
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`https://api.github.com/repos/${username}/${repo}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then((data) => {

                if (data.message === "Not Found") {
                    setData(null);
                    setLoading(false);
                    return;
                }
                setData(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching GitHub data:", error);
                setData(null);
                setLoading(false);
            });
    }
        , [username, repo]);
    if (loading) {
        return <div className="flex items-center justify-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;
    }
    if (!data) {
        return <div className="flex items-center justify-center h-full">No data</div>;
    }
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="flex items-center justify-center gap-2 mb-4">
                <FaGithub size={35} className="text-neutral" />
                <h1 className="text-2xl font-bold">{data.name}</h1>
            </div>
            <p className="text-center text-lg">{data.description}</p>
            <p className="text-center text-lg">Created at: {format(new Date(data.created_at), "M/yy")}</p>
            <p className="text-center text-lg">Updated at: {format(new Date(data.updated_at), "M/yy")}</p>
            <div className="flex gap-4 mt-4">

            </div>

        </div>
    );



}   