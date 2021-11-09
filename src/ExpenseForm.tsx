import React, {
  FormEventHandler,
  useCallback,
  useEffect,
  useState,
} from "react";
import "./App.css";
import {
  Container,
  Form,
  Button,
  FloatingLabel,
  Spinner,
  ToastContainer,
  Toast,
} from "react-bootstrap";
import moment from "moment";
import axios from "axios";

const ExpenseForm = ({
  categories,
  selectedCategory,
}: {
  categories: string[];
  selectedCategory: string | undefined;
}) => {
  const [date, setDate] = useState(moment(new Date()).format("YYYY-MM-DD"));
  const [who, setWho] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [amount, setAmount] = useState<number | string>("");
  const [what, setWhat] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isToastShowing, setIsToastShowing] = useState(false);

  useEffect(() => {
    if (selectedCategory) {
      setCategory(selectedCategory);
    }
  }, [selectedCategory]);

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(
    async (e) => {
      if (isSubmitting) {
        return;
      }
      if (
        category === undefined ||
        who === undefined ||
        amount === undefined ||
        what === undefined ||
        date === undefined
      ) {
        return;
      }

      e.preventDefault();

      setIsSubmitting(true);

      try {
        const res = await axios.post("https://bufi.haminet.fm/expense", {
          date,
          who,
          category,
          amount,
          what,
        });
        if (res.status === 200) {
          setWho("");
          setCategory("");
          setAmount("");
          setWhat("");
          setDate(moment(new Date()).format("YYYY-MM-DD"));
          setIsToastShowing(true);
        }
      } catch (error) {}

      setIsSubmitting(false);
      return false;
    },
    [category, amount, what, date, who, isSubmitting]
  );

  return (
    <div id="expense-form">
      <Form onSubmit={handleSubmit}>
        <Container>
          <h1>Add Expense</h1>
          <FloatingLabel controlId="floatingSelect" label="Category">
            <Form.Select
              required
              size="lg"
              aria-label="Default select example"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value={""} disabled></option>
              {categories.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Form.Select>
          </FloatingLabel>
          <FloatingLabel controlId="floatingSelect" label="Who">
            <Form.Select
              size="lg"
              aria-label="Default select example"
              required
              value={who}
              onChange={(e) => setWho(e.target.value)}
            >
              <option value="" disabled></option>
              <option value="Dror">Dror</option>
              <option value="Rina">Rina</option>
            </Form.Select>
          </FloatingLabel>
          <FloatingLabel controlId="floatingSelect" label="How Much">
            <Form.Control
              size="lg"
              type="number"
              required
              min={0}
              max={10000}
              placeholder="How Much"
              value={amount}
              onChange={(e) => setAmount(parseInt(e.target.value))}
            />
          </FloatingLabel>
          <FloatingLabel controlId="floatingSelect" label="Description">
            <Form.Control
              size="lg"
              type="text"
              placeholder="What"
              value={what || ""}
              onChange={(e) => setWhat(e.target.value)}
            />
          </FloatingLabel>
          <FloatingLabel controlId="floatingSelect" label="Date">
            <Form.Control
              size="lg"
              type="date"
              required
              placeholder="When"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                e.target.blur();
              }}
            />
          </FloatingLabel>
          <div className="d-grid gap-2">
            <Button
              disabled={isSubmitting}
              type="submit"
              variant="success"
              size="lg"
            >
              {isSubmitting && <Spinner size="sm" animation="border" />}
              {!isSubmitting && "Add Expense"}
            </Button>
          </div>
        </Container>
      </Form>
      <ToastContainer position="bottom-center">
        <Toast
          autohide
          show={isToastShowing}
          onClose={() => setIsToastShowing(false)}
          delay={3000}
        >
          <Toast.Header
            closeButton={false}
            style={{ justifyContent: "center" }}
          >
            Expense Saved!
          </Toast.Header>
          <Toast.Body style={{ justifyContent: "center", textAlign: "center" }}>
            YOU ARE THE CHAMPION OF THE $$$
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default ExpenseForm;
