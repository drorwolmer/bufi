import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import { Container, Nav, Navbar, ProgressBar, Spinner } from "react-bootstrap";
import moment from "moment";
import ExpenseForm from "./ExpenseForm";
import { BudgetEntry, ExpenseEntry } from "./types";
import { AppDispatch, bufiApi } from "./store";
import { useDispatch } from "react-redux";

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

  const { expenses } = bufiApi.endpoints.getExpenses.useQuery(undefined, {
    selectFromResult: ({ data }) => ({
      expenses: data?.filter((e) => e.category === entry.name).slice(0, 10),
    }),
  });

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
          <tr key={e.id} className="budget-expenses">
            <td style={{ width: "10px" }}>
              {moment(e.timestamp).format("DD/MM")}
            </td>
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
      <td>{moment(expense.timestamp).format("DD/MM")}</td>
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
  const dispatch = useDispatch<AppDispatch>();
  const [page, setPage] = useState<"budget" | "expenses" | "form">("budget");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [selectedExpense, setSelectedExpense] = useState<number>();

  const {
    data: expenses,
    isFetching: expensesLoading,
    refetch: refetchExpenses,
  } = bufiApi.endpoints.getExpenses.useQuery(undefined, {
    // pollingInterval: 3000,
  });
  const {
    budgetEntries,
    budgetLoading,
    totalIncome,
    totalExpense,
    refetch: refetchBudget,
  } = bufiApi.endpoints.getBudget.useQuery(undefined, {
    selectFromResult: ({ data, isFetching }) => ({
      budgetEntries: data?.expenses,
      budgetIncome: data?.income,
      budgetLoading: isFetching,
      totalIncome: data?.income.reduce((a, b) => a + b.budget, 0) || 0,
      totalExpense: data?.expenses.reduce((a, b) => a + b.expense, 0) || 0,
    }),
  });

  const isFetching = expensesLoading || budgetLoading;

  const handleBudgetClick: React.MouseEventHandler = (e) => {
    setSelectedCategory(undefined);
    setPage("budget");
    refetchBudget();
  };

  const handleExpensesClick: React.MouseEventHandler = (e) => {
    setPage("expenses");
    refetchExpenses();
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
