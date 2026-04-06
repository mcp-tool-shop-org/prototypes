use tiny_rust_cli::greet;

#[test]
fn test_greet() {
    assert_eq!(greet("world"), "Hello, world!");
}
