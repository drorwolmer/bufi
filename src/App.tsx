import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import axios from "axios";
import { Container, Nav, Navbar, ProgressBar, Spinner } from "react-bootstrap";
import moment from "moment";
import ExpenseForm from "./ExpenseForm";

export type BudgetEntry = {
  name: string;
  budget: number;
  expense: number;
};

export type ExpenseEntry = {
  id: number;
  date: moment.Moment;
  category: string;
  expense: number;
  who: string;
  description: string;
};

const getProgressColor = (remainingPercent: number) => {
  if (remainingPercent === 0) {
    return "info";
  } else if (remainingPercent < 75) {
    return "warning";
  } else if (remainingPercent <= 100) {
    return "warning";
  } else {
    return "danger";
  }
};

const getExpenses = async (): Promise<ExpenseEntry[]> => {
  const res = await axios.get<string[][]>("https://bufi.haminet.fm/expenses");

  let id = 0;

  const data: ExpenseEntry[] = res.data
    .map((r) => {
      return {
        id: id++,
        date: moment(r[0], "DD/MM/YYYY"),
        category: r[1],
        expense: parseInt(r[2]),
        who: r[3],
        description: r[4],
      };
    })
    .sort((a, b) => a.date.valueOf() - b.date.valueOf());
  data.reverse();
  return data;
};

const getBudget = async (): Promise<{
  budgetEntries: BudgetEntry[];
  totalExpense: number;
  totalIncome: number;
}> => {
  const res = await axios.get<string[][]>("https://bufi.haminet.fm/budget");
  const budgetEntries: BudgetEntry[] = res.data
    .map((r) => {
      return {
        name: r[0],
        budget: Math.abs(parseInt(r[1])),
        expense: parseInt(r[2]),
      };
    })
    .filter((v) => v.expense >= 0);

  const totalIncome = res.data
    .map((r) => {
      return {
        name: r[0],
        budget: Math.abs(parseInt(r[1])),
        expense: r[2],
      };
    })
    .filter((v) => v.expense === "INCOME")
    .reduce((acc, v) => acc + v.budget, 0);

  const totalExpense = budgetEntries.reduce((acc, v) => acc + v.expense, 0);
  return { budgetEntries: budgetEntries, totalIncome, totalExpense };
};

const BudgetRow = ({
  entry,
  onClick,
  onProgressBarClick,
  showEntries,
}: {
  entry: BudgetEntry;
  onClick: React.MouseEventHandler;
  onProgressBarClick: React.MouseEventHandler;
  showEntries: boolean;
}) => {
  const remaining = entry.budget - entry.expense;
  const remainingPercent = 100 * (entry.expense / entry.budget);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>();

  useEffect(() => {
    if (!showEntries) {
      return;
    }
    getExpenses().then((r) => {
      setExpenses(r.filter((e) => e.category === entry.name).slice(0, 10));
    });
  }, [showEntries, entry.name]);

  const color = useMemo(() => {
    return getProgressColor(remainingPercent);
  }, [remainingPercent]);

  let label = `${entry.expense}`;
  if (remaining < 0) {
    label = `${entry.expense} (${entry.budget - entry.expense})`;
  }

  return (
    <>
      <tr>
        <td onClick={onClick} className="entry-name">
          {entry.name}
        </td>
        {/* <td>{entry.budget}</td>
      <td>{entry.expense}</td>
      <td>{remaining}</td> */}
        <td className="entry-progress" colSpan={3}>
          <ProgressBar onClick={onProgressBarClick}>
            <ProgressBar
              striped
              variant={color}
              label={label}
              now={remainingPercent}
            />

            {remaining >= 0 && (
              <ProgressBar
                striped
                variant={"success"}
                label={remaining}
                now={Math.max(100 - remainingPercent, 0)}
              />
            )}
          </ProgressBar>
        </td>
      </tr>
      {showEntries && expenses === undefined && (
        <tr>
          <td colSpan={4} className="spinner">
            <Spinner size="sm" animation="border" />
          </td>
        </tr>
      )}
      {showEntries &&
        expenses?.map((e) => (
          <tr className="budget-expenses">
            <td style={{ width: "10px" }}>{e.date.format("DD/MM")}</td>
            <td>{`${e.expense}`}</td>
            <td>{e.description || ""}</td>
            <td>{e.who}</td>
          </tr>
        ))}
    </>
  );
};

const ExpenseRow = ({
  expense,
  isExpanded,
  onClick,
}: {
  expense: ExpenseEntry;
  isExpanded: boolean;
  onClick: () => void;
}) => {
  return (
    <tr className="expense-row" onClick={onClick}>
      <td>{expense.date.format("DD/MM")}</td>
      <td>
        {expense.category}
        {isExpanded && <div>{expense.description}</div>}
      </td>
      <td>{expense.expense}</td>
      <td>{expense.who}</td>
    </tr>
  );
};

function App() {
  const [budgetEntries, setBudgetEntries] = useState<BudgetEntry[]>();
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [isFetching, setFetching] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [page, setPage] = useState<"budget" | "expenses" | "form">("budget");
  const [selectedCategory, setSelectedCategory] = useState<string>();

  const [selectedExpense, setSelectedExpense] = useState<number>();

  const fetchBudget = useCallback(async () => {
    if (isFetching) {
      console.error("Already fetching");
      return;
    }
    setFetching(true);
    const v = await getBudget();
    setBudgetEntries(v.budgetEntries);
    setTotalExpense(v.totalExpense);
    setTotalIncome(v.totalIncome);
    setFetching(false);
  }, [isFetching]);

  const fetchExpenses = useCallback(async () => {
    if (isFetching) {
      console.error("Already fetching");
      return;
    }
    setFetching(true);
    const v = await getExpenses();
    setExpenses(v);
    setFetching(false);
  }, [isFetching]);

  useEffect(() => {
    if (isInitialized || isFetching) {
      return;
    }
    setSelectedCategory(undefined);
    fetchBudget().then(() => setIsInitialized(true));
  }, [isInitialized, fetchBudget, isFetching]);

  const handleBudgetClick: React.MouseEventHandler = (e) => {
    setSelectedCategory(undefined);
    setPage("budget");
    fetchBudget();
    e.preventDefault();
  };

  const handleExpensesClick: React.MouseEventHandler = (e) => {
    setPage("expenses");
    fetchExpenses();
    e.preventDefault();
  };

  const handleBudgetNameClick: React.MouseEventHandler = (e) => {
    setSelectedCategory(e.currentTarget.textContent || "");
    setPage("form");
    e.preventDefault();
    setTimeout(() => {
      setSelectedCategory(undefined);
    }, 200);
  };

  return (
    <div className="App">
      <Navbar id="bottom-nav" variant="dark" bg="dark">
        <Container>
          <Navbar.Brand href="#home">🦉 BUFI</Navbar.Brand>
          <Nav
            fill
            className="top-navbar"
            variant="pills"
            defaultActiveKey="#budget"
          >
            <Nav.Item>
              <Nav.Link
                active={page === "budget"}
                href="#budget"
                onClick={handleBudgetClick}
              >
                Budget
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={page === "expenses"}
                href="#expenses"
                onClick={handleExpensesClick}
              >
                Expenses
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                active={page === "form"}
                href="#add"
                onClick={() => {
                  setPage("form");
                }}
              >
                💰 Add
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Container>
      </Navbar>

      {page === "form" && (
        <ExpenseForm
          selectedCategory={selectedCategory}
          categories={budgetEntries?.map((v) => v.name) || []}
        />
      )}

      {isFetching && (
        <div className="loading">
          <ProgressBar animated now={100} />
        </div>
      )}

      {!isFetching && page === "expenses" && (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <tbody>
                {expenses?.map((e) => (
                  <ExpenseRow
                    key={e.id.toString()}
                    expense={e}
                    isExpanded={e.id === selectedExpense}
                    onClick={() => {
                      if (e.id === selectedExpense) {
                        setSelectedExpense(undefined);
                      } else {
                        setSelectedExpense(e.id);
                      }
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!isFetching && page === "budget" && (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <tbody>
                {budgetEntries?.map((e) => (
                  <BudgetRow
                    onClick={handleBudgetNameClick}
                    showEntries={selectedCategory === e.name}
                    onProgressBarClick={() => {
                      setSelectedCategory(
                        selectedCategory === e.name ? undefined : e.name
                      );
                    }}
                    key={e.name}
                    entry={e}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="total">
            <ProgressBar>
              <ProgressBar
                striped
                variant={getProgressColor(100 * (totalExpense / totalIncome))}
                label={totalExpense}
                now={100 * (totalExpense / totalIncome)}
              />
              <ProgressBar
                striped
                variant="success"
                label={totalIncome - totalExpense}
                now={100 - 100 * (totalExpense / totalIncome)}
              />
            </ProgressBar>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
