import React, { useEffect, useState } from "react";
import { Card, Container, Spinner } from "react-bootstrap";
import axios from "axios";

export default function AllEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5050/api/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Container>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(325px, 1fr))",
            gap: "1.5rem",
            maxWidth: "1450px",
            margin: "0 auto"
          }}
        >
          {employees.map((emp) => (
            <Card key={emp.id} className="h-100 shadow-sm">
              <Card.Img
                variant="top"
                src={`http://localhost:5050/images/${emp.image_filename || "default.png"}`}
                alt={emp.employee_name}
                style={{
                  objectFit: "contain",
                  height: "180px",
                  marginTop: "0.5rem",
                  borderRadius: "6px 6px 0 0"
                }}
              />
              <Card.Body>
                <Card.Title className="text-center mb-2">{emp.employee_name}</Card.Title>
                <Card.Text className="text-muted small text-center mb-2">
                  {emp.designation}
                </Card.Text>
                <Card.Text className="mb-1"><strong>Dept:</strong> {emp.department}</Card.Text>
                <Card.Text className="mb-1"><strong>Age:</strong> {emp.age}</Card.Text>
                <Card.Text className="mb-1"><strong>Gender:</strong> {emp.gender}</Card.Text>
                <Card.Text className="mb-1"><strong>Contact:</strong> {emp.contact_no}</Card.Text>
                <Card.Text className="mb-0"><strong>Email:</strong> {emp.email || "Not Provided"}</Card.Text>
                <Card.Text className="mb-0"><strong>Bio Id:</strong> {emp.bio_id || "Not Provided"}</Card.Text>
                <Card.Text className="mb-0"><strong>DOB:</strong> {emp.dob ? new Date(emp.dob).toLocaleDateString() : "Not Provided"}
                </Card.Text>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
