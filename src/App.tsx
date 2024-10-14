import React, { useState, useEffect, useRef } from "react";

// Custom Tag component
const TagBadge: React.FC<{ tag: string }> = ({ tag }) => (
  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
    {tag.charAt(0).toUpperCase() + tag.slice(1)}
  </span>
);

// Custom Card component
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={`bg-white rounded-lg shadow-md ${className}`} {...props}>
    {children}
  </div>
);

// Custom CardContent component
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={`p-4 ${className}`} {...props}>
    {children}
  </div>
);

// Custom Button component
const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "outline" | "ghost" | "destructive";
  }
> = ({ children, className, variant = "default", ...props }) => {
  const baseStyle =
    "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variantStyles = {
    default: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    outline:
      "border border-gray-300 text-gray-500 hover:bg-gray-50 focus:ring-gray-500",
    ghost: "text-gray-500 hover:bg-gray-100 focus:ring-gray-500",
    destructive: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  };

  return (
    <button
      className={`${baseStyle} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface Story {
  objectID: string;
  title: string;
  author: string;
  created_at: string;
  url: string;
  _tags: string[];
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Story[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortField, setSortField] = useState<"author" | "title">("author");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStories();
  }, [currentPage]);

  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://hn.algolia.com/api/v1/search?tags=front_page&page=${currentPage}`
      );
      const data = await response.json();
      setTotalPages(data.nbPages);
      setTasks(data.hits);
    } catch (error) {
      console.error("Error fetching stories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleCard = (id: string) =>
    setExpandedCard(expandedCard === id ? null : id);
  const removeTask = (id: string) =>
    setTasks(tasks.filter((task) => task.objectID !== id));
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const sortTasks = (field: "author" | "title") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const Sidebar: React.FC = () => (
    <aside
      ref={sidebarRef}
      className={`bg-slate-800 text-white flex flex-col h-screen ${
        isSidebarOpen ? "fixed inset-y-0 left-0 z-50 w-64" : "hidden"
      } md:flex md:w-64 md:fixed md:inset-y-0`}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Story Manager</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <Button variant="ghost" className="w-full justify-start">
                Dashboard
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="w-full justify-start">
                Team
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="w-full justify-start">
                Calendar
              </Button>
            </li>
          </ul>
        </nav>
      </div>
      <div className="p-6">
        <Button variant="outline" className="w-full">
          Log Out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col max-h-[100dvh]">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b border-b-gray-300">
          <Button variant="ghost" className="md:hidden" onClick={toggleSidebar}>
            Menu
          </Button>
          <Button variant="outline">Notifications</Button>
        </header>

        <main className="p-6 min-h-0 overflow-y-auto">
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Stories</h1>
            <div>
              <Button onClick={() => sortTasks("author")} className="mr-2">
                Author{" "}
                {sortField === "author" &&
                  (sortDirection === "asc" ? "▲" : "▼")}
              </Button>
              <Button onClick={() => sortTasks("title")}>
                Title{" "}
                {sortField === "title" && (sortDirection === "asc" ? "▲" : "▼")}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p>Loading stories...</p>
          ) : (
            sortedTasks.map((task) => (
              <Card key={task.objectID} className="mb-4">
                <CardContent>
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleCard(task.objectID)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-1">
                        {task._tags.map((tag) => (
                          <TagBadge tag={tag} key={tag} />
                        ))}
                      </div>
                      <span className="font-medium">{task.author}</span>
                      <span className="text-sm text-gray-500">
                        {task.created_at}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-700">{task.title}</p>
                    </div>
                  </div>
                  {expandedCard === task.objectID && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="mb-4">
                        Extended details about the story would go here...
                      </p>
                      <div className="flex justify-between">
                        <Button
                          variant="destructive"
                          onClick={() => removeTask(task.objectID)}
                        >
                          Remove Story
                        </Button>
                        <Button>Show Details</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}

          <div className="mt-6 flex justify-center">
            {Array.from(Array(totalPages).keys()).map((_, pageNumber) => {
              return (
                <Button
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  className="mx-1"
                >
                  {pageNumber + 1}
                </Button>
              );
            })}
          </div>
        </main>

        <footer className="bg-white shadow-sm p-4 mt-auto flex justify-between items-center border-t border-t-gray-300">
          <Button variant="outline" className="md:hidden">
            Log Out
          </Button>
          <Button variant="outline">Help Center</Button>
        </footer>
      </div>
    </div>
  );
};

export default App;
